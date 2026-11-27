import status from "http-status";
import AppError from "../errorHelpers/AppError.js";
import { prisma } from "../lib/prisma.js";

// Guards for ids sent by the client: the row must exist and not be deleted.

export const assertCarExists = async (id: string | null | undefined) => {
    if (!id) return;
    const car = await prisma.car.findFirst({ where: { id, deleted_at: null }, select: { id: true } });
    if (!car) throw new AppError(status.BAD_REQUEST, "বাছাই করা গাড়ি পাওয়া যায়নি");
};

export const assertDriverExists = async (id: string | null | undefined) => {
    if (!id) return;
    const driver = await prisma.driver.findFirst({ where: { id, deleted_at: null }, select: { id: true } });
    if (!driver) throw new AppError(status.BAD_REQUEST, "বাছাই করা ড্রাইভার পাওয়া যায়নি");
};
