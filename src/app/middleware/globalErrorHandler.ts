import { NextFunction, Request, Response } from "express";
import status from "http-status";
import z from "zod";
import { env } from "../../config/env.js";
import { Prisma } from "../../generated/prisma/client.js";
import AppError from "../errorHelpers/AppError.js";
import {
    handlePrismaClientInitializationError,
    handlePrismaClientKnownRequestError,
    handlePrismaClientUnknownError,
    handlePrismaClientValidationError,
} from "../errorHelpers/handlePrismaErrors.js";
import { handleZodError } from "../errorHelpers/handleZodError.js";
import { IErrorResponse, ISimplifiedError } from "../interfaces/error.interfaces.js";

const isProduction = env.NODE_ENV === "production";

/** An http-errors style 4xx whose message is safe to show (bad JSON, body too large). */
const isClientHttpError = (err: Error): err is Error & { status: number } => {
    const e = err as Error & { status?: unknown; expose?: unknown };
    return typeof e.status === "number" && e.status >= 400 && e.status < 500 && e.expose === true;
};

const fromMessage = (statusCode: number, message: string): ISimplifiedError => ({
    statusCode,
    message,
    errorSource: [{ path: "", message }],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    let simplified: ISimplifiedError;

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        simplified = handlePrismaClientKnownRequestError(err);
    } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        simplified = handlePrismaClientUnknownError(err);
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        simplified = handlePrismaClientValidationError();
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
        simplified = handlePrismaClientInitializationError();
    } else if (err instanceof z.ZodError) {
        simplified = handleZodError(err);
    } else if (err instanceof AppError) {
        simplified = fromMessage(err.statusCode, err.message);
    } else if (err instanceof Error && isClientHttpError(err)) {
        simplified = fromMessage(err.status, err.message);
    } else {
        // An unexpected error's own message can carry internals, so production
        // answers generically and keeps the detail for the server log.
        const message = !isProduction && err instanceof Error ? err.message : "সার্ভারে সমস্যা হয়েছে";
        simplified = fromMessage(status.INTERNAL_SERVER_ERROR, message);
    }

    if (simplified.statusCode >= 500) {
        console.error(`[error] ${req.method} ${req.originalUrl} -> ${simplified.statusCode}:`, err);
    }

    const errorResponse: IErrorResponse = {
        success: false,
        message: simplified.message,
        errorSource: simplified.errorSource,
        stack: env.NODE_ENV === "development" && err instanceof Error ? err.stack : undefined,
    };

    res.status(simplified.statusCode).json(errorResponse);
};
