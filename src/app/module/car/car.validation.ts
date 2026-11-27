import z from "zod";
import { CarStatus, CarType } from "../../../generated/prisma/enums.js";
import { optionalDate, optionalText, requiredText } from "../../shared/validators.js";

export const createCarZodSchema = z.object({
    name: requiredText("গাড়ির নাম/মডেল", 80),
    number: requiredText("গাড়ির নম্বর", 40),
    type: z.enum(CarType, "গাড়ির ধরন বাছাই করুন").optional(),
    status: z.enum(CarStatus, "অবস্থা বাছাই করুন").optional(),
    fitness_expiry: optionalDate(),
    tax_token_expiry: optionalDate(),
    insurance_expiry: optionalDate(),
    route_permit_expiry: optionalDate(),
    note: optionalText(),
});

export const updateCarZodSchema = createCarZodSchema.partial();

export type ICreateCarPayload = z.infer<typeof createCarZodSchema>;
export type IUpdateCarPayload = z.infer<typeof updateCarZodSchema>;
