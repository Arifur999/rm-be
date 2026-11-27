import status from "http-status";
import { Prisma } from "../../../generated/prisma/client.js";
import { TripStatus } from "../../../generated/prisma/enums.js";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { DateRange } from "../../shared/dates.js";
import { ListOptions, pageSlice } from "../../shared/listQuery.js";
import { assertCarExists, assertDriverExists } from "../../shared/refs.js";
import {
    ICollectTripPayload,
    ICreateTripPayload,
    IUpdateTripPayload,
    PAID_OVER_FARE,
} from "./trip.validation.js";

export interface TripFilters {
    range: DateRange | null;
    car_id?: string;
    driver_id?: string;
    status?: string;
    due_only?: boolean;
}

const tripInclude = {
    car: { select: { id: true, name: true, number: true } },
    driver: { select: { id: true, name: true, phone: true } },
    expenses: {
        where: { deleted_at: null },
        select: { id: true, category: true, amount: true, note: true },
        orderBy: { created_at: "asc" },
    },
} satisfies Prisma.TripInclude;

type TripWithIncludes = Prisma.TripGetPayload<{ include: typeof tripInclude }>;

// Adds the numbers every screen shows next to a trip.
const withTotals = (trip: TripWithIncludes) => {
    const expenseTotal = trip.expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0);
    const due = trip.status === "cancelled" ? 0 : Math.max(0, trip.fare.toNumber() - trip.paid.toNumber());
    return { ...trip, due, expense_total: expenseTotal };
};

const findTripOrThrow = async (id: string) => {
    const trip = await prisma.trip.findFirst({ where: { id, deleted_at: null }, include: tripInclude });
    if (!trip) throw new AppError(status.NOT_FOUND, "ট্রিপ পাওয়া যায়নি");
    return trip;
};

const buildWhere = (filters: TripFilters, search?: string): Prisma.TripWhereInput => ({
    deleted_at: null,
    ...(filters.range ? { trip_date: { gte: filters.range.from, lte: filters.range.to } } : {}),
    ...(filters.car_id ? { car_id: filters.car_id } : {}),
    ...(filters.driver_id ? { driver_id: filters.driver_id } : {}),
    ...(filters.status && filters.status in TripStatus ? { status: filters.status as TripStatus } : {}),
    ...(filters.due_only ? { status: { not: "cancelled" }, paid: { lt: prisma.trip.fields.fare } } : {}),
    ...(search
        ? {
            OR: [
                { from_place: { contains: search, mode: "insensitive" } },
                { to_place: { contains: search, mode: "insensitive" } },
                { customer_name: { contains: search, mode: "insensitive" } },
                { customer_phone: { contains: search } },
            ],
        }
        : {}),
});

const getAllTrips = async (filters: TripFilters, options: ListOptions) => {
    const where = buildWhere(filters, options.search);
    const ranWhere: Prisma.TripWhereInput = { AND: [where, { status: { not: "cancelled" } }] };

    const [rows, total, ranAgg, paidAgg] = await Promise.all([
        prisma.trip.findMany({
            where,
            include: tripInclude,
            orderBy: [{ trip_date: "desc" }, { created_at: "desc" }],
            ...pageSlice(options),
        }),
        prisma.trip.count({ where }),
        prisma.trip.aggregate({ where: ranWhere, _count: { _all: true }, _sum: { fare: true, paid: true } }),
        prisma.trip.aggregate({ where, _sum: { paid: true } }),
    ]);

    const fare = ranAgg._sum.fare?.toNumber() ?? 0;
    const paidOnRan = ranAgg._sum.paid?.toNumber() ?? 0;
    const summary = {
        trips: ranAgg._count._all,
        fare,
        paid: paidAgg._sum.paid?.toNumber() ?? 0,
        due: Math.max(0, fare - paidOnRan),
    };

    return { rows: rows.map(withTotals), total, summary };
};

const getTripById = async (id: string) => withTotals(await findTripOrThrow(id));

const createTrip = async (payload: ICreateTripPayload) => {
    await Promise.all([assertCarExists(payload.car_id), assertDriverExists(payload.driver_id)]);
    const { expenses = [], ...tripData } = payload;

    const trip = await prisma.$transaction(async (tx) => {
        const created = await tx.trip.create({ data: tripData });
        if (expenses.length > 0) {
            await tx.expense.createMany({
                data: expenses.map((e) => ({
                    ...e,
                    expense_date: created.trip_date,
                    car_id: created.car_id,
                    driver_id: created.driver_id,
                    trip_id: created.id,
                })),
            });
        }
        return created;
    });

    return getTripById(trip.id);
};

const updateTrip = async (id: string, payload: IUpdateTripPayload) => {
    const existing = await findTripOrThrow(id);
    await Promise.all([assertCarExists(payload.car_id), assertDriverExists(payload.driver_id)]);

    const fare = payload.fare ?? existing.fare.toNumber();
    const paid = payload.paid ?? existing.paid.toNumber();
    if (paid > fare) throw new AppError(status.BAD_REQUEST, PAID_OVER_FARE);

    await prisma.$transaction(async (tx) => {
        await tx.trip.update({ where: { id }, data: payload });

        // Keep the trip's own costs on the same day, car and driver as the trip.
        if (payload.trip_date || payload.car_id || payload.driver_id) {
            await tx.expense.updateMany({
                where: { trip_id: id, deleted_at: null },
                data: {
                    ...(payload.trip_date ? { expense_date: payload.trip_date } : {}),
                    ...(payload.car_id ? { car_id: payload.car_id } : {}),
                    ...(payload.driver_id ? { driver_id: payload.driver_id } : {}),
                },
            });
        }
    });

    return getTripById(id);
};

// Customer paid (part of) what was still due.
const collectDue = async (id: string, payload: ICollectTripPayload) => {
    const trip = await findTripOrThrow(id);
    if (trip.status === "cancelled") {
        throw new AppError(status.BAD_REQUEST, "বাতিল ট্রিপে টাকা জমা নেওয়া যাবে না");
    }

    const due = trip.fare.toNumber() - trip.paid.toNumber();
    if (payload.amount > due + 0.001) {
        throw new AppError(status.BAD_REQUEST, `বাকি আছে মাত্র ৳${due.toLocaleString("bn-BD")}`);
    }

    await prisma.trip.update({ where: { id }, data: { paid: { increment: payload.amount } } });
    return getTripById(id);
};

// The trip's own expenses go with it, otherwise they would keep counting.
const deleteTrip = async (id: string) => {
    await findTripOrThrow(id);
    const now = new Date();
    await prisma.$transaction([
        prisma.expense.updateMany({ where: { trip_id: id, deleted_at: null }, data: { deleted_at: now } }),
        prisma.trip.update({ where: { id }, data: { deleted_at: now } }),
    ]);
    return null;
};

export const TripService = {
    getAllTrips,
    getTripById,
    createTrip,
    updateTrip,
    collectDue,
    deleteTrip,
};
