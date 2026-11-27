import status from "http-status";
import { env } from "../../config/env.js";
import { Prisma } from "../../generated/prisma/client.js";
import { ISimplifiedError } from "../interfaces/error.interfaces.js";

// Prisma messages name tables and columns. Development shows them; production
// logs them and answers with a fixed sentence.
const safeMessage = (error: { code?: string; message: string }, fallback: string): string => {
    if (env.NODE_ENV !== "production") return error.message || fallback;
    console.error(`[prisma] ${error.code ?? "unknown"}: ${error.message}`);
    return fallback;
};

const simple = (statusCode: number, message: string): ISimplifiedError => ({
    statusCode,
    message,
    errorSource: [{ path: "", message }],
});

export const handlePrismaClientKnownRequestError = (error: Prisma.PrismaClientKnownRequestError): ISimplifiedError => {
    switch (error.code) {
        case "P2002":
            return simple(status.CONFLICT, "এই তথ্য আগে থেকেই আছে");
        case "P2003":
            return simple(status.CONFLICT, "এটি অন্য রেকর্ডের সাথে যুক্ত, তাই করা যাচ্ছে না");
        case "P2025":
            return simple(status.NOT_FOUND, "রেকর্ড পাওয়া যায়নি");
        default:
            return simple(status.BAD_REQUEST, safeMessage(error, "ডাটাবেসে সমস্যা হয়েছে"));
    }
};

export const handlePrismaClientUnknownError = (error: Prisma.PrismaClientUnknownRequestError): ISimplifiedError =>
    simple(status.INTERNAL_SERVER_ERROR, safeMessage(error, "ডাটাবেসে সমস্যা হয়েছে"));

export const handlePrismaClientValidationError = (): ISimplifiedError =>
    simple(status.BAD_REQUEST, "ভুল তথ্য পাঠানো হয়েছে");

export const handlePrismaClientInitializationError = (): ISimplifiedError =>
    simple(status.INTERNAL_SERVER_ERROR, "ডাটাবেসের সাথে যুক্ত হওয়া যাচ্ছে না");
