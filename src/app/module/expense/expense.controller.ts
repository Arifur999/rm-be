import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { parseDateRange } from "../../shared/dates.js";
import { paginationMeta, parseListOptions, queryString } from "../../shared/listQuery.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { ExpenseService } from "./expense.service.js";

const getAllExpenses = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const options = parseListOptions(query);
    const { rows, total, summary } = await ExpenseService.getAllExpenses(
        {
            range: parseDateRange(query, false),
            category: queryString(query, "category"),
            car_id: queryString(query, "car_id"),
            driver_id: queryString(query, "driver_id"),
            trip_id: queryString(query, "trip_id"),
        },
        options
    );
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "খরচের তালিকা পাওয়া গেছে",
        data: rows,
        meta: paginationMeta(options, total, summary),
    });
});

const createExpense = catchAsync(async (req: Request, res: Response) => {
    const result = await ExpenseService.createExpense(req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.CREATED,
        message: "খরচ যোগ হয়েছে",
        data: result,
    });
});

const updateExpense = catchAsync(async (req: Request, res: Response) => {
    const result = await ExpenseService.updateExpense(req.params.id as string, req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "খরচ আপডেট হয়েছে",
        data: result,
    });
});

const deleteExpense = catchAsync(async (req: Request, res: Response) => {
    await ExpenseService.deleteExpense(req.params.id as string);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "খরচ মুছে ফেলা হয়েছে",
        data: null,
    });
});

export const ExpenseController = {
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
};
