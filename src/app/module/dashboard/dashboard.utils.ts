import { addDays, daysBetween } from "../../shared/dates.js";

export interface DailyPoint {
    date: string;
    income: number;
    expense: number;
}

/** One point per day from `from` to `to` inclusive; days with no records are 0. */
export const fillDailySeries = (
    from: string,
    to: string,
    income: Map<string, number>,
    expense: Map<string, number>
): DailyPoint[] => {
    const days = daysBetween(from, to);
    const points: DailyPoint[] = [];
    for (let i = 0; i <= days; i += 1) {
        const date = addDays(from, i);
        points.push({ date, income: income.get(date) ?? 0, expense: expense.get(date) ?? 0 });
    }
    return points;
};

export const EXPIRY_FIELDS = [
    { field: "fitness_expiry", label: "ফিটনেস" },
    { field: "tax_token_expiry", label: "ট্যাক্স টোকেন" },
    { field: "insurance_expiry", label: "ইন্স্যুরেন্স" },
    { field: "route_permit_expiry", label: "রুট পারমিট" },
] as const;

export type ExpiryField = (typeof EXPIRY_FIELDS)[number]["field"];

export interface ExpiryCar {
    id: string;
    name: string;
    number: string;
    expiries: Partial<Record<ExpiryField, string | null>>;
}

export interface ExpiryAlert {
    car_id: string;
    car_name: string;
    car_number: string;
    document: string;
    expiry_date: string;
    days_left: number; // negative = already expired
}

/** Papers expiring within `withinDays` of today (or already expired), soonest first. */
export const buildExpiryAlerts = (cars: ExpiryCar[], today: string, withinDays: number): ExpiryAlert[] => {
    const alerts: ExpiryAlert[] = [];
    for (const car of cars) {
        for (const { field, label } of EXPIRY_FIELDS) {
            const date = car.expiries[field];
            if (!date) continue;
            const daysLeft = daysBetween(today, date);
            if (daysLeft <= withinDays) {
                alerts.push({
                    car_id: car.id,
                    car_name: car.name,
                    car_number: car.number,
                    document: label,
                    expiry_date: date,
                    days_left: daysLeft,
                });
            }
        }
    }
    return alerts.sort((a, b) => a.days_left - b.days_left);
};
