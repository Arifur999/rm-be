import status from "http-status";
import { Prisma } from "../../../generated/prisma/client.js";
import { CarStatus } from "../../../generated/prisma/enums.js";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { DateRange } from "../../shared/dates.js";
import { tripAndExpenseTotals } from "../../shared/totals.js";
import { ICreateCarPayload, IUpdateCarPayload } from "./car.validation.js";

// "ঢাকা মেট্রো-গ  ১২-৩৪৫৬" and "ঢাকা মেট্রো-গ ১২-৩৪৫৬" are the same car.
const normalizeNumber = (value: string) => value.trim().replace(/\s+/g, " ");

const assertNumberFree = async (number: string, exceptId?: string) => {
    const clash = await prisma.car.findFirst({
        where: {
            number: { equals: number, mode: "insensitive" },
            deleted_at: null,
            ...(exceptId ? { id: { not: exceptId } } : {}),
        },
        select: { id: true },
    });
    if (clash) {
        throw new AppError(status.CONFLICT, "এই নম্বরের গাড়ি আগে থেকেই আছে");
    }
};

const findCarOrThrow = async (id: string) => {
    const car = await prisma.car.findFirst({ where: { id, deleted_at: null } });
    if (!car) throw new AppError(status.NOT_FOUND, "গাড়ি পাওয়া যায়নি");
    return car;
};

const getAllCars = async (filters: { search?: string; status?: string }) => {
    const where: Prisma.CarWhereInput = {
        deleted_at: null,
        ...(filters.status && filters.status in CarStatus ? { status: filters.status as CarStatus } : {}),
        ...(filters.search
            ? {
                OR: [
                    { name: { contains: filters.search, mode: "insensitive" } },
                    { number: { contains: filters.search, mode: "insensitive" } },
                ],
            }
            : {}),
    };

    return prisma.car.findMany({
        where,
        // Running cars first, then newest.
        orderBy: [{ status: "asc" }, { created_at: "desc" }],
    });
};

const createCar = async (payload: ICreateCarPayload) => {
    const number = normalizeNumber(payload.number);
    await assertNumberFree(number);
    return prisma.car.create({ data: { ...payload, number } });
};

const updateCar = async (id: string, payload: IUpdateCarPayload) => {
    await findCarOrThrow(id);
    const data = { ...payload };
    if (payload.number !== undefined) {
        data.number = normalizeNumber(payload.number);
        await assertNumberFree(data.number, id);
    }
    return prisma.car.update({ where: { id }, data });
};

// Soft delete: old trips and expenses keep pointing at the car, so history and
// totals stay correct. Drivers lose it as their default car.
const deleteCar = async (id: string) => {
    await findCarOrThrow(id);
    await prisma.$transaction([
        prisma.driver.updateMany({ where: { default_car_id: id }, data: { default_car_id: null } }),
        prisma.car.update({ where: { id }, data: { deleted_at: new Date() } }),
    ]);
    return null;
};

const getCarSummary = async (id: string, range: DateRange) => {
    const car = await findCarOrThrow(id);
    const dateFilter = { gte: range.from, lte: range.to };

    const [totals, recentTrips] = await Promise.all([
        tripAndExpenseTotals({ car_id: id, trip_date: dateFilter }, { car_id: id, expense_date: dateFilter }),
        prisma.trip.findMany({
            where: { car_id: id, deleted_at: null, trip_date: dateFilter },
            include: { driver: { select: { id: true, name: true } } },
            orderBy: [{ trip_date: "desc" }, { created_at: "desc" }],
            take: 10,
        }),
    ]);

    return { car, range: { from: range.fromKey, to: range.toKey }, totals, recent_trips: recentTrips };
};

export const CarService = {
    getAllCars,
    createCar,
    updateCar,
    deleteCar,
    getCarSummary,
};
