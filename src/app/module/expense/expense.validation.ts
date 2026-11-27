import z from "zod";
import { ExpenseCategory } from "../../../generated/prisma/enums.js";
import { money, optionalEntityId, optionalText, requiredDate } from "../../shared/validators.js";

export const createExpenseZodSchema = z.object({
    expense_date: requiredDate("খরচের তারিখ"),
    category: z.enum(ExpenseCategory, "খরচের ধরন বাছাই করুন"),
    amount: money("খরচ").positive("খরচের পরিমাণ দিন"),
    car_id: optionalEntityId("গাড়ি"),
    driver_id: optionalEntityId("ড্রাইভার"),
    trip_id: optionalEntityId("ট্রিপ"),
    note: optionalText(),
});

export const updateExpenseZodSchema = createExpenseZodSchema.partial();

export type ICreateExpensePayload = z.infer<typeof createExpenseZodSchema>;
export type IUpdateExpensePayload = z.infer<typeof updateExpenseZodSchema>;
