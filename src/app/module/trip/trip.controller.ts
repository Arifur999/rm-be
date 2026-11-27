import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { parseDateRange } from "../../shared/dates.js";
import { paginationMeta, parseListOptions, queryString } from "../../shared/listQuery.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { TripService } from "./trip.service.js";

const getAllTrips = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const options = parseListOptions(query);
    const { rows, total, summary } = await TripService.getAllTrips(
        {
            range: parseDateRange(query, false),
            car_id: queryString(query, "car_id"),
            driver_id: queryString(query, "driver_id"),
            status: queryString(query, "status"),
            due_only: query.due_only === "true" || query.due_only === "1",
        },
        options
    );
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ট্রিপের তালিকা পাওয়া গেছে",
        data: rows,
        meta: paginationMeta(options, total, summary),
    });
});

const getTripById = catchAsync(async (req: Request, res: Response) => {
    const result = await TripService.getTripById(req.params.id as string);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ট্রিপ পাওয়া গেছে",
        data: result,
    });
});

const createTrip = catchAsync(async (req: Request, res: Response) => {
    const result = await TripService.createTrip(req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.CREATED,
        message: "ট্রিপ যোগ হয়েছে",
        data: result,
    });
});

const updateTrip = catchAsync(async (req: Request, res: Response) => {
    const result = await TripService.updateTrip(req.params.id as string, req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ট্রিপ আপডেট হয়েছে",
        data: result,
    });
});

const collectDue = catchAsync(async (req: Request, res: Response) => {
    const result = await TripService.collectDue(req.params.id as string, req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "বাকি টাকা জমা হয়েছে",
        data: result,
    });
});

const deleteTrip = catchAsync(async (req: Request, res: Response) => {
    await TripService.deleteTrip(req.params.id as string);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ট্রিপ মুছে ফেলা হয়েছে",
        data: null,
    });
});

export const TripController = {
    getAllTrips,
    getTripById,
    createTrip,
    updateTrip,
    collectDue,
    deleteTrip,
};
