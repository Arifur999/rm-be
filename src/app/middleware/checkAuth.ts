import { NextFunction, Request, Response } from "express";
import status from "http-status";
import type { Role } from "../../generated/prisma/enums.js";
import AppError from "../errorHelpers/AppError.js";
import { findSession } from "../utils/session.js";

/** Requires `Authorization: Bearer <session token>`. */
export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
        if (!token) {
            throw new AppError(status.UNAUTHORIZED, "আগে লগইন করুন");
        }

        const session = await findSession(token);
        if (!session) {
            throw new AppError(status.UNAUTHORIZED, "লগইনের মেয়াদ শেষ, আবার লগইন করুন");
        }

        req.user = {
            adminId: session.admin.id,
            sessionId: session.id,
            email: session.admin.email,
            role: session.admin.role,
        };
        next();
    } catch (error) {
        next(error);
    }
};

/** Use after checkAuth: only these roles get through. */
export const requireRole =
    (...roles: Role[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError(status.FORBIDDEN, "এই কাজের অনুমতি নেই"));
        }
        next();
    };
