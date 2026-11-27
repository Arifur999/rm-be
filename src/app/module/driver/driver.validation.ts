import z from "zod";
import { DriverStatus } from "../../../generated/prisma/enums.js";
import { optionalDate, optionalEntityId, optionalText, requiredText } from "../../shared/validators.js";

export const createDriverZodSchema = z.object({
    name: requiredText("ড্রাইভারের নাম", 80),
    phone: requiredText("মোবাইল নম্বর", 20).regex(/^[0-9+\-\s]{6,20}$/, "সঠিক মোবাইল নম্বর দিন"),
    license_number: optionalText(40),
    address: optionalText(200),
    joined_at: optionalDate(),
    default_car_id: optionalEntityId("গাড়ি"),
    status: z.enum(DriverStatus, "অবস্থা বাছাই করুন").optional(),
    note: optionalText(),
});

export const updateDriverZodSchema = createDriverZodSchema.partial();

export type ICreateDriverPayload = z.infer<typeof createDriverZodSchema>;
export type IUpdateDriverPayload = z.infer<typeof updateDriverZodSchema>;
