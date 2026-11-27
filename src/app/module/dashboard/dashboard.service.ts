import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { addDays, dateKey, DateRange, dhakaToday, toDbDate } from "../../shared/dates.js";
import { tripAndExpenseTotals } from "../../shared/totals.js";
import { buildExpiryAlerts, EXPIRY_FIELDS, fillDailySeries } from "./dashboard.utils.js";

const CHART_DAYS = 30;
const EXPIRY_WARNING_DAYS = 30;

const num = (value: Prisma.Decimal | null | undefined): number => (value ? value.toNumber() : 0);

const getDashboard = async (range: DateRange) => {
    const today = dhakaToday();
    const dateFilter = { gte: range.from, lte: range.to };
    const ranInRange: Prisma.TripWhereInput = {
        deleted_at: null,
        status: { not: "cancelled" },
        trip_date: dateFilter,
    };

    const chartFrom = addDays(today, -(CHART_DAYS - 1));
    const chartFilter = { gte: toDbDate(chartFrom), lte: toDbDate(today) };
    const expiryLimit = toDbDate(addDays(today, EXPIRY_WARNING_DAYS));

    const [
        totals,
        cars,
        drivers,
        tripsByCar,
        tripsByDriver,
        expenseByCategory,
        chartIncome,
        chartExpense,
        dueTrips,
        dueAll,
        expiryCars,
    ] = await Promise.all([
        tripAndExpenseTotals({ trip_date: dateFilter }, { expense_date: dateFilter }),
        prisma.car.findMany({
            where: { deleted_at: null, status: { not: "inactive" } },
            select: { id: true, name: true, number: true, status: true },
            orderBy: { created_at: "asc" },
        }),
        prisma.driver.findMany({
            where: { deleted_at: null, status: "active" },
            select: { id: true, name: true, phone: true },
            orderBy: { created_at: "asc" },
        }),
        prisma.trip.groupBy({ by: ["car_id"], where: ranInRange, _count: { _all: true }, _sum: { paid: true } }),
        prisma.trip.groupBy({ by: ["driver_id"], where: ranInRange, _count: { _all: true }, _sum: { paid: true } }),
        prisma.expense.groupBy({
            by: ["category"],
            where: { deleted_at: null, expense_date: dateFilter },
            _sum: { amount: true },
        }),
        prisma.trip.groupBy({
            by: ["trip_date"],
            where: { deleted_at: null, trip_date: chartFilter },
            _sum: { paid: true },
        }),
        prisma.expense.groupBy({
            by: ["expense_date"],
            where: { deleted_at: null, expense_date: chartFilter },
            _sum: { amount: true },
        }),
        // Oldest unpaid trips first: those are the ones to chase.
        prisma.trip.findMany({
            where: { deleted_at: null, status: { not: "cancelled" }, paid: { lt: prisma.trip.fields.fare } },
            select: {
                id: true,
                trip_date: true,
                customer_name: true,
                customer_phone: true,
                from_place: true,
                to_place: true,
                fare: true,
                paid: true,
                car: { select: { name: true, number: true } },
            },
            orderBy: { trip_date: "asc" },
            take: 10,
        }),
        prisma.trip.aggregate({
            where: { deleted_at: null, status: { not: "cancelled" }, paid: { lt: prisma.trip.fields.fare } },
            _count: { _all: true },
            _sum: { fare: true, paid: true },
        }),
        prisma.car.findMany({
            where: {
                deleted_at: null,
                status: { not: "inactive" },
                OR: EXPIRY_FIELDS.map(({ field }) => ({ [field]: { lte: expiryLimit } })),
            },
            select: {
                id: true,
                name: true,
                number: true,
                fitness_expiry: true,
                tax_token_expiry: true,
                insurance_expiry: true,
                route_permit_expiry: true,
            },
        }),
    ]);

    // Every running car is listed, so one that never left the garage shows 0.
    const carCounts = new Map(tripsByCar.map((g) => [g.car_id, g]));
    const perCar = cars
        .map((car) => ({
            ...car,
            trips: carCounts.get(car.id)?._count._all ?? 0,
            income: num(carCounts.get(car.id)?._sum.paid),
        }))
        .sort((a, b) => b.trips - a.trips);

    const driverCounts = new Map(tripsByDriver.map((g) => [g.driver_id, g]));
    const perDriver = drivers
        .map((driver) => ({
            ...driver,
            trips: driverCounts.get(driver.id)?._count._all ?? 0,
            income: num(driverCounts.get(driver.id)?._sum.paid),
        }))
        .sort((a, b) => b.trips - a.trips);

    const chart = fillDailySeries(
        chartFrom,
        today,
        new Map(chartIncome.map((g) => [dateKey(g.trip_date), num(g._sum.paid)])),
        new Map(chartExpense.map((g) => [dateKey(g.expense_date), num(g._sum.amount)]))
    );

    const toKey = (d: Date | null) => (d ? dateKey(d) : null);
    const expiryAlerts = buildExpiryAlerts(
        expiryCars.map((car) => ({
            id: car.id,
            name: car.name,
            number: car.number,
            expiries: {
                fitness_expiry: toKey(car.fitness_expiry),
                tax_token_expiry: toKey(car.tax_token_expiry),
                insurance_expiry: toKey(car.insurance_expiry),
                route_permit_expiry: toKey(car.route_permit_expiry),
            },
        })),
        today,
        EXPIRY_WARNING_DAYS
    );

    return {
        range: { from: range.fromKey, to: range.toKey },
        today,
        totals,
        per_car: perCar,
        idle_cars: perCar.filter((c) => c.trips === 0 && c.status === "active").length,
        per_driver: perDriver,
        expense_by_category: expenseByCategory
            .map((g) => ({ category: g.category, amount: num(g._sum.amount) }))
            .sort((a, b) => b.amount - a.amount),
        chart,
        due: {
            total: Math.max(0, num(dueAll._sum.fare) - num(dueAll._sum.paid)),
            count: dueAll._count._all,
            trips: dueTrips.map((t) => ({ ...t, due: num(t.fare) - num(t.paid) })),
        },
        expiry_alerts: expiryAlerts,
    };
};

export const DashboardService = {
    getDashboard,
};
