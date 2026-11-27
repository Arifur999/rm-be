import z from "zod";
import { requiredText } from "../../shared/validators.js";

export const loginZodSchema = z.object({
    email: z.email("সঠিক ইমেইল দিন").trim().toLowerCase(),
    password: z.string("পাসওয়ার্ড দিন").min(1, "পাসওয়ার্ড দিন").max(200),
});

export const changePasswordZodSchema = z
    .object({
        current_password: z.string("বর্তমান পাসওয়ার্ড দিন").min(1, "বর্তমান পাসওয়ার্ড দিন"),
        new_password: z
            .string("নতুন পাসওয়ার্ড দিন")
            .min(6, "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
            .max(200, "পাসওয়ার্ড বেশি লম্বা"),
    })
    .refine((v) => v.current_password !== v.new_password, {
        message: "নতুন পাসওয়ার্ড আগেরটার মতো হতে পারবে না",
        path: ["new_password"],
    });

export const updateSettingsZodSchema = z.object({
    business_name: requiredText("ব্যবসার নাম", 80),
});

export type ILoginPayload = z.infer<typeof loginZodSchema>;
export type IChangePasswordPayload = z.infer<typeof changePasswordZodSchema>;
export type IUpdateSettingsPayload = z.infer<typeof updateSettingsZodSchema>;
