import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const parseResult = zodSchema.safeParse(req.body ?? {});

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: parseResult.error.issues[0]?.message ?? "তথ্য সঠিক নয়",
                errorSource: parseResult.error.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        req.body = parseResult.data;
        next();
    };
};
