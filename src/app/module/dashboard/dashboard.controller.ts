import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { parseDateRange } from "../../shared/dates.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { DashboardService } from "./dashboard.service.js";

const getDashboard = catchAsync(async (req: Request, res: Response) => {
    const range = parseDateRange(req.query as Record<string, unknown>, true);
    const result = await DashboardService.getDashboard(range);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ড্যাশবোর্ডের তথ্য পাওয়া গেছে",
        data: result,
    });
});

export const DashboardController = {
    getDashboard,
};
