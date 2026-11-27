import type { Request } from "express";
import rateLimit from "express-rate-limit";
import status from "http-status";

// Every request reaches the API from the Next.js server, not from the
// visitor's browser, so the client IP is the hosting provider's and would put
// everybody in one bucket. Password guessing is therefore counted per email.
const emailKey = (req: Request): string => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return `login:${email || "unknown"}`;
};

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: emailKey,
    statusCode: status.TOO_MANY_REQUESTS,
    message: { success: false, message: "অনেকবার ভুল চেষ্টা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।" },
});
