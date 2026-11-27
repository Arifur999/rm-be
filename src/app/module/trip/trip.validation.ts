import z from "zod";
import { ExpenseCategory, TripStatus } from "../../../generated/prisma/enums.js";
import {
    entityId,
    money,
    optionalText,
    requiredDate,
    requiredText,
    timeOfDay,
} from "../../shared/validators.js";

const PAID_OVER_FARE = "পেয়েছি টাকা ভাড়ার চেয়ে বেশি হতে পারে না";

const tripFields = z.object({
    trip_date: requiredDate("ট্রিপের তারিখ"),
    car_id: entityId("গাড়ি"),
    driver_id: entityId("ড্রাইভার"),
    from_place: requiredText("কোথা থেকে", 120),
    to_place: requiredText("কোথায়", 120),
    customer_name: optionalText(80),
    customer_phone: optionalText(20),
    out_time: timeOfDay(),
    return_time: timeOfDay(),
    fare: money("ভাড়া"),
    paid: money("পেয়েছি টাকা").optional(),
    status: z.enum(TripStatus, "অবস্থা বাছাই করুন").optional(),
    note: optionalText(),
});

// Costs entered together with the trip (fuel, toll ...). They become normal
// expenses linked to the trip, its car and its driver.
const tripExpense = z.object({
    category: z.enum(ExpenseCategory, "খরচের ধরন বাছাই করুন"),
    amount: money("খরচ").positive("খরচের পরিমাণ দিন"),
    note: optionalText(200),
});

export const createTripZodSchema = tripFields
    .extend({ expenses: z.array(tripExpense).max(20, "একসাথে ২০টির বেশি খরচ দেওয়া যাবে না").optional() })
    .refine((v) => (v.paid ?? 0) <= v.fare, { message: PAID_OVER_FARE, path: ["paid"] });

// paid <= fare is checked in the service against the stored values.
export const updateTripZodSchema = tripFields.partial();

export const collectTripZodSchema = z.object({
    amount: money("টাকার পরিমাণ").positive("টাকার পরিমাণ দিন"),
});

export type ICreateTripPayload = z.infer<typeof createTripZodSchema>;
export type IUpdateTripPayload = z.infer<typeof updateTripZodSchema>;
export type ICollectTripPayload = z.infer<typeof collectTripZodSchema>;
export { PAID_OVER_FARE };
