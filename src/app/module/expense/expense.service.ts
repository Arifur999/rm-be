import status from "http-status";
import { Prisma } from "../../../generated/prisma/client.js";
import { ExpenseCategory } from "../../../generated/prisma/enums.js";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { DateRange } from "../../shared/dates.js";
import { ListOptions, pageSlice } from "../../shared/listQuery.js";
import { assertCarExists, assertDriverExists } from "../../shared/refs.js";
import { ICreateExpensePayload, IUpdateExpensePayload } from "./expense.validation.js";

export interface ExpenseFilters {
    range: DateRange | null;
    category?: string;
    car_id?: string;
    driver_id?: string;
    trip_id?: string;
}

const expenseInclude = {
    car: { select: { id: true, name: true, number: true } },
    driver: { select: { id: true, name: true } },
    trip: { select: { id: true, from_place: true, to_place: true, trip_date: true } },
} satisfies Prisma.ExpenseInclude;

const findExpenseOrThrow = async (id: string) => {
    const expense = await prisma.expense.findFirst({ where: { id, deleted_at: null } });
    if (!expense) throw new AppError(status.NOT_FOUND, "খরচ পাওয়া যায়নি");
    return expense;
};

const findTripOrThrow = async (id: string) => {
    const trip = await prisma.trip.findFirst({ where: { id, deleted_at: null } });
    if (!trip) throw new AppError(status.BAD_REQUEST, "বাছাই করা ট্রিপ পাওয়া যায়নি");
    return trip;
};

const getAllExpenses = async (filters: ExpenseFilters, options: ListOptions) => {
    const where: Prisma.ExpenseWhereInput = {
        deleted_at: null,
        ...(filters.range ? { expense_date: { gte: filters.range.from, lte: filters.range.to } } : {}),
        ...(filters.category && filters.category in ExpenseCategory
            ? { category: filters.category as ExpenseCategory }
            : {}),
        ...(filters.car_id ? { car_id: filters.car_id } : {}),
        ...(filters.driver_id ? { driver_id: filters.driver_id } : {}),
        ...(filters.trip_id ? { trip_id: filters.trip_id } : {}),
        ...(options.search ? { note: { contains: options.search, mode: "insensitive" } } : {}),
    };

    const [rows, total, agg, byCategory] = await Promise.all([
        prisma.expense.findMany({
            where,
            include: expenseInclude,
            orderBy: [{ expense_date: "desc" }, { created_at: "desc" }],
            ...pageSlice(options),
        }),
        prisma.expense.count({ where }),
        prisma.expense.aggregate({ where, _sum: { amount: true } }),
        prisma.expense.groupBy({ by: ["category"], where, _sum: { amount: true } }),
    ]);

    // { total, fuel, toll, ... } for the summary strip above the list.
    const summary: Record<string, number> = { total: agg._sum.amount?.toNumber() ?? 0 };
    for (const group of byCategory) {
        summary[group.category] = group._sum.amount?.toNumber() ?? 0;
    }

    return { rows, total, summary };
};

const createExpense = async (payload: ICreateExpensePayload) => {
    const data = { ...payload };
    // A cost attached to a trip defaults to that trip's car and driver.
    if (data.trip_id) {
        const trip = await findTripOrThrow(data.trip_id);
        data.car_id ??= trip.car_id;
        data.driver_id ??= trip.driver_id;
    }
    await Promise.all([assertCarExists(data.car_id), assertDriverExists(data.driver_id)]);
    return prisma.expense.create({ data, include: expenseInclude });
};

const updateExpense = async (id: string, payload: IUpdateExpensePayload) => {
    await findExpenseOrThrow(id);
    if (payload.trip_id) await findTripOrThrow(payload.trip_id);
    await Promise.all([assertCarExists(payload.car_id), assertDriverExists(payload.driver_id)]);
    return prisma.expense.update({ where: { id }, data: payload, include: expenseInclude });
};

const deleteExpense = async (id: string) => {
    await findExpenseOrThrow(id);
    await prisma.expense.update({ where: { id }, data: { deleted_at: new Date() } });
    return null;
};

export const ExpenseService = {
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
};
