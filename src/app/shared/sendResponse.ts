import { Response } from "express";

export interface IMeta {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
    // Totals over the whole filtered list, not just this page.
    summary?: Record<string, number>;
}

interface IResponseData<T> {
    httpStatus: number;
    success: boolean;
    data?: T;
    meta?: IMeta;
    message: string;
}

const isDecimalLike = (value: unknown): value is { toNumber: () => number } =>
    value !== null &&
    typeof value === "object" &&
    typeof (value as { toNumber?: unknown }).toNumber === "function" &&
    typeof (value as { toFixed?: unknown }).toFixed === "function";

// `date` columns go out as "YYYY-MM-DD", timestamps as ISO, Decimal as number.
const serializeDate = (value: Date): string => {
    const isUtcMidnight =
        value.getUTCHours() === 0 &&
        value.getUTCMinutes() === 0 &&
        value.getUTCSeconds() === 0 &&
        value.getUTCMilliseconds() === 0;
    return isUtcMidnight ? value.toISOString().slice(0, 10) : value.toISOString();
};

export const serializeData = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return serializeDate(value);
    if (isDecimalLike(value)) return value.toNumber();
    if (Array.isArray(value)) return value.map((item) => serializeData(item));
    if (typeof value === "object") {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(value)) {
            result[key] = serializeData((value as Record<string, unknown>)[key]);
        }
        return result;
    }
    return value;
};

export const sendResponse = <T>(res: Response, responseData: IResponseData<T>) => {
    const { httpStatus, success, data, message, meta } = responseData;
    res.status(httpStatus).json({
        success,
        message,
        data: serializeData(data),
        meta: meta ? serializeData(meta) : undefined,
    });
};
