import status from "http-status";
import AppError from "../errorHelpers/AppError.js";

// All business dates are calendar days in Bangladesh time, stored in `date`
// columns. A day travels as "YYYY-MM-DD" and becomes a UTC-midnight Date.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isDateString = (value: unknown): value is string => {
    if (typeof value !== "string" || !DATE_RE.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    // Rejects 2026-02-30, which Date would silently roll into March.
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const toDbDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

export const dateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const dhakaToday = (now: Date = new Date()): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(now);

export const addDays = (day: string, days: number): string => {
    const date = toDbDate(day);
    date.setUTCDate(date.getUTCDate() + days);
    return dateKey(date);
};

export const daysBetween = (from: string, to: string): number =>
    Math.round((toDbDate(to).getTime() - toDbDate(from).getTime()) / 86_400_000);

export interface DateRange {
    from: Date;
    to: Date;
    fromKey: string;
    toKey: string;
}

const pick = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);

/**
 * `?from=YYYY-MM-DD&to=YYYY-MM-DD`, both inclusive. When `required`, a missing
 * range means today (Dhaka); otherwise a missing range returns null (no filter).
 */
export function parseDateRange(query: Record<string, unknown>, required: true): DateRange;
export function parseDateRange(query: Record<string, unknown>, required: false): DateRange | null;
export function parseDateRange(query: Record<string, unknown>, required: boolean): DateRange | null {
    const rawFrom = pick(query.from);
    const rawTo = pick(query.to);
    if (!required && !rawFrom && !rawTo) return null;

    const fromKey = rawFrom ?? rawTo ?? dhakaToday();
    const toKey = rawTo ?? fromKey;

    if (!isDateString(fromKey) || !isDateString(toKey)) {
        throw new AppError(status.BAD_REQUEST, "সঠিক তারিখ দিন");
    }
    if (fromKey > toKey) {
        throw new AppError(status.BAD_REQUEST, "শুরুর তারিখ শেষের তারিখের পরে হতে পারে না");
    }
    return { from: toDbDate(fromKey), to: toDbDate(toKey), fromKey, toKey };
}
