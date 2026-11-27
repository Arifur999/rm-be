import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { parseDateRange } from "../../shared/dates.js";
import { queryString } from "../../shared/listQuery.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { CarService } from "./car.service.js";

const getAllCars = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const result = await CarService.getAllCars({
        search: queryString(query, "search"),
        status: queryString(query, "status"),
    });
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "গাড়ির তালিকা পাওয়া গেছে",
        data: result,
    });
});

const createCar = catchAsync(async (req: Request, res: Response) => {
    const result = await CarService.createCar(req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.CREATED,
        message: "গাড়ি যোগ হয়েছে",
        data: result,
    });
});

const updateCar = catchAsync(async (req: Request, res: Response) => {
    const result = await CarService.updateCar(req.params.id as string, req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "গাড়ির তথ্য আপডেট হয়েছে",
        data: result,
    });
});

const deleteCar = catchAsync(async (req: Request, res: Response) => {
    await CarService.deleteCar(req.params.id as string);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "গাড়ি মুছে ফেলা হয়েছে",
        data: null,
    });
});

const getCarSummary = catchAsync(async (req: Request, res: Response) => {
    const range = parseDateRange(req.query as Record<string, unknown>, true);
    const result = await CarService.getCarSummary(req.params.id as string, range);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "গাড়ির হিসাব পাওয়া গেছে",
        data: result,
    });
});

export const CarController = {
    getAllCars,
    createCar,
    updateCar,
    deleteCar,
    getCarSummary,
};
