import z from "zod";
import { isDateString, toDbDate } from "./dates.js";

// Reusable zod pieces with Bangla messages.

export const requiredText = (label: string, max = 120) =>
    z.string(`${label} দিন`).trim().min(1, `${label} দিন`).max(max, `${label} বেশি লম্বা`);

/** Optional text; "" becomes null so a field can be cleared. */
export const optionalText = (max = 500) =>
    z
        .string("লেখা সঠিক নয়")
        .trim()
        .max(max, "লেখা বেশি লম্বা")
        .nullable()
        .optional()
        .transform((v) => (v === "" ? null : v));

export const requiredDate = (label = "তারিখ") =>
    z.string(`${label} দিন`).refine(isDateString, `সঠিক ${label} দিন`).transform(toDbDate);

/** Optional day; "" or null clears it. */
export const optionalDate = () =>
    z
        .string("সঠিক তারিখ দিন")
        .nullable()
        .optional()
        .refine((v) => v === undefined || v === null || v === "" || isDateString(v), "সঠিক তারিখ দিন")
        .transform((v) => (v === undefined ? undefined : v ? toDbDate(v) : null));

export const money = (label: string) =>
    z
        .number(`${label} সংখ্যায় দিন`)
        .min(0, `${label} মাইনাস হতে পারে না`)
        .max(100_000_000, `${label} অনেক বেশি`);

/** "HH:mm" or empty. */
export const timeOfDay = () =>
    z
        .string("সময় ঠিক নেই")
        .nullable()
        .optional()
        .refine((v) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "সময় ঠিক নেই")
        .transform((v) => (v === "" ? null : v));

export const entityId = (label: string) => z.uuid(`${label} বাছাই করুন`);

export const optionalEntityId = (label: string) =>
    z
        .union([z.uuid(`${label} সঠিক নয়`), z.literal(""), z.null()])
        .optional()
        .transform((v) => (v === "" ? null : v));
