import { Request, Response } from "express";
import status from "http-status";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AuthService } from "./auth.service.js";

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "লগইন সফল হয়েছে",
        data: result,
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    await AuthService.logout(req.user as IRequestUser);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "লগআউট হয়েছে",
        data: null,
    });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.getMe(req.user as IRequestUser);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "তথ্য পাওয়া গেছে",
        data: result,
    });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    await AuthService.changePassword(req.body, req.user as IRequestUser);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "পাসওয়ার্ড পরিবর্তন হয়েছে",
        data: null,
    });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.updateSettings(req.body, req.user as IRequestUser);
    sendResponse(res, {
        success: true,
        httpStatus: status.OK,
        message: "সেটিংস সেভ হয়েছে",
        data: result,
    });
});

export const AuthController = {
    login,
    logout,
    getMe,
    changePassword,
    updateSettings,
};
