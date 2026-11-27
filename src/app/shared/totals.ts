import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const num = (value: Prisma.Decimal | null | undefined): number => (value ? value.toNumber() : 0);

/**
 * Trip and expense totals for any filter (one car, one driver, a date range).
 *
 * - trips: trips that actually ran (cancelled ones are left out)
 * - income: money received, including an advance kept on a cancelled trip
 * - due: fare - paid over trips that ran
 */
export const tripAndExpenseTotals = async (
    tripWhere: Prisma.TripWhereInput,
    expenseWhere: Prisma.ExpenseWhereInput
) => {
    const base: Prisma.TripWhereInput = { ...tripWhere, deleted_at: null };
    const ran: Prisma.TripWhereInput = { ...base, status: { not: "cancelled" } };

    const [ranAgg, incomeAgg, expenseAgg] = await Promise.all([
        prisma.trip.aggregate({ where: ran, _count: { _all: true }, _sum: { fare: true, paid: true } }),
        prisma.trip.aggregate({ where: base, _sum: { paid: true } }),
        prisma.expense.aggregate({ where: { ...expenseWhere, deleted_at: null }, _sum: { amount: true } }),
    ]);

    const income = num(incomeAgg._sum.paid);
    const expense = num(expenseAgg._sum.amount);
    return {
        trips: ranAgg._count._all,
        fare: num(ranAgg._sum.fare),
        income,
        expense,
        profit: income - expense,
        due: Math.max(0, num(ranAgg._sum.fare) - num(ranAgg._sum.paid)),
    };
};
