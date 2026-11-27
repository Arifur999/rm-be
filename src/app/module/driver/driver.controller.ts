import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { parseDateRange } from "../../shared/dates.js";
import { queryString } from "../../shared/listQuery.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { DriverService } from "./driver.service.js";

const getAllDrivers = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const result = await DriverService.getAllDrivers({
        search: queryString(query, "search"),
        status: queryString(query, "status"),
    });
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ড্রাইভারের তালিকা পাওয়া গেছে",
        data: result,
    });
});

const createDriver = catchAsync(async (req: Request, res: Response) => {
    const result = await DriverService.createDriver(req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.CREATED,
        message: "ড্রাইভার যোগ হয়েছে",
        data: result,
    });
});

const updateDriver = catchAsync(async (req: Request, res: Response) => {
    const result = await DriverService.updateDriver(req.params.id as string, req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ড্রাইভারের তথ্য আপডেট হয়েছে",
        data: result,
    });
});

const deleteDriver = catchAsync(async (req: Request, res: Response) => {
    await DriverService.deleteDriver(req.params.id as string);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ড্রাইভার মুছে ফেলা হয়েছে",
        data: null,
    });
});

const getDriverSummary = catchAsync(async (req: Request, res: Response) => {
    const range = parseDateRange(req.query as Record<string, unknown>, true);
    const result = await DriverService.getDriverSummary(req.params.id as string, range);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ড্রাইভারের হিসাব পাওয়া গেছে",
        data: result,
    });
});

export const DriverController = {
    getAllDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    getDriverSummary,
};
