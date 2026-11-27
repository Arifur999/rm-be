import { Request, Response } from "express";
import status from "http-status";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { UserService } from "./user.service.js";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.getAllUsers();
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "ইউজারের তালিকা পাওয়া গেছে",
        data: result,
    });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.createUser(req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.CREATED,
        message: "নতুন অ্যাকাউন্ট তৈরি হয়েছে",
        data: result,
    });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.updateUser(req.params.id as string, req.body, req.user as IRequestUser);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "অ্যাকাউন্ট আপডেট হয়েছে",
        data: result,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    await UserService.resetPassword(req.params.id as string, req.body, req.user as IRequestUser);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "নতুন পাসওয়ার্ড সেট হয়েছে",
        data: null,
    });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    await UserService.deleteUser(req.params.id as string, req.user as IRequestUser);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "অ্যাকাউন্ট মুছে ফেলা হয়েছে",
        data: null,
    });
});

export const UserController = {
    getAllUsers,
    createUser,
    updateUser,
    resetPassword,
    deleteUser,
};
