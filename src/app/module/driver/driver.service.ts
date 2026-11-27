import status from "http-status";
import { Prisma } from "../../../generated/prisma/client.js";
import { DriverStatus } from "../../../generated/prisma/enums.js";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { DateRange } from "../../shared/dates.js";
import { assertCarExists } from "../../shared/refs.js";
import { tripAndExpenseTotals } from "../../shared/totals.js";
import { ICreateDriverPayload, IUpdateDriverPayload } from "./driver.validation.js";

const defaultCarSelect = { select: { id: true, name: true, number: true } } as const;

const findDriverOrThrow = async (id: string) => {
    const driver = await prisma.driver.findFirst({
        where: { id, deleted_at: null },
        include: { default_car: defaultCarSelect },
    });
    if (!driver) throw new AppError(status.NOT_FOUND, "ড্রাইভার পাওয়া যায়নি");
    return driver;
};

const getAllDrivers = async (filters: { search?: string; status?: string }) => {
    const where: Prisma.DriverWhereInput = {
        deleted_at: null,
        ...(filters.status && filters.status in DriverStatus ? { status: filters.status as DriverStatus } : {}),
        ...(filters.search
            ? {
                OR: [
                    { name: { contains: filters.search, mode: "insensitive" } },
                    { phone: { contains: filters.search } },
                ],
            }
            : {}),
    };

    return prisma.driver.findMany({
        where,
        include: { default_car: defaultCarSelect },
        orderBy: [{ status: "asc" }, { created_at: "desc" }],
    });
};

const createDriver = async (payload: ICreateDriverPayload) => {
    await assertCarExists(payload.default_car_id);
    return prisma.driver.create({ data: payload, include: { default_car: defaultCarSelect } });
};

const updateDriver = async (id: string, payload: IUpdateDriverPayload) => {
    await findDriverOrThrow(id);
    await assertCarExists(payload.default_car_id);
    return prisma.driver.update({ where: { id }, data: payload, include: { default_car: defaultCarSelect } });
};

// Soft delete keeps old trips and payments in the history.
const deleteDriver = async (id: string) => {
    await findDriverOrThrow(id);
    await prisma.driver.update({ where: { id }, data: { deleted_at: new Date() } });
    return null;
};

const getDriverSummary = async (id: string, range: DateRange) => {
    const driver = await findDriverOrThrow(id);
    const dateFilter = { gte: range.from, lte: range.to };

    const [totals, paidToDriver, recentTrips] = await Promise.all([
        tripAndExpenseTotals({ driver_id: id, trip_date: dateFilter }, { driver_id: id, expense_date: dateFilter }),
        prisma.expense.aggregate({
            where: { driver_id: id, category: "driver_payment", deleted_at: null, expense_date: dateFilter },
            _sum: { amount: true },
        }),
        prisma.trip.findMany({
            where: { driver_id: id, deleted_at: null, trip_date: dateFilter },
            include: { car: { select: { id: true, name: true, number: true } } },
            orderBy: [{ trip_date: "desc" }, { created_at: "desc" }],
            take: 10,
        }),
    ]);

    return {
        driver,
        range: { from: range.fromKey, to: range.toKey },
        totals: { ...totals, paid_to_driver: paidToDriver._sum.amount?.toNumber() ?? 0 },
        recent_trips: recentTrips,
    };
};

export const DriverService = {
    getAllDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    getDriverSummary,
};
