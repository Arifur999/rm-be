import z from "zod";
import { Role } from "../../../generated/prisma/enums.js";
import { requiredText } from "../../shared/validators.js";

const password = z
    .string("পাসওয়ার্ড দিন")
    .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
    .max(200, "পাসওয়ার্ড বেশি লম্বা");

export const createUserZodSchema = z.object({
    name: requiredText("নাম", 80),
    email: z.email("সঠিক ইমেইল দিন").trim().toLowerCase(),
    password,
    role: z.enum(Role, "ভূমিকা বাছাই করুন").optional(),
});

export const updateUserZodSchema = z.object({
    name: requiredText("নাম", 80).optional(),
    is_active: z.boolean("সক্রিয়/বন্ধ বাছাই করুন").optional(),
});

export const resetPasswordZodSchema = z.object({ password });

export type ICreateUserPayload = z.infer<typeof createUserZodSchema>;
export type IUpdateUserPayload = z.infer<typeof updateUserZodSchema>;
export type IResetPasswordPayload = z.infer<typeof resetPasswordZodSchema>;
