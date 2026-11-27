import bcrypt from "bcryptjs";
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { PASSWORD_SALT_ROUNDS } from "../../utils/seed.js";
import { ICreateUserPayload, IResetPasswordPayload, IUpdateUserPayload } from "./user.validation.js";

// Super admin only (enforced in the routes). Never returns password hashes.
const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    is_active: true,
    created_at: true,
} as const;

const findUserOrThrow = async (id: string) => {
    const user = await prisma.admin.findUnique({ where: { id } });
    if (!user) throw new AppError(status.NOT_FOUND, "ইউজার পাওয়া যায়নি");
    return user;
};

const getAllUsers = async () =>
    prisma.admin.findMany({ select: userSelect, orderBy: [{ role: "asc" }, { created_at: "asc" }] });

const createUser = async (payload: ICreateUserPayload) => {
    const exists = await prisma.admin.findUnique({ where: { email: payload.email }, select: { id: true } });
    if (exists) throw new AppError(status.CONFLICT, "এই ইমেইলে আগেই অ্যাকাউন্ট আছে");

    return prisma.admin.create({
        data: {
            name: payload.name,
            email: payload.email,
            role: payload.role ?? "owner",
            password_hash: await bcrypt.hash(payload.password, PASSWORD_SALT_ROUNDS),
        },
        select: userSelect,
    });
};

const updateUser = async (id: string, payload: IUpdateUserPayload, me: IRequestUser) => {
    await findUserOrThrow(id);
    if (id === me.adminId && payload.is_active === false) {
        throw new AppError(status.BAD_REQUEST, "নিজের অ্যাকাউন্ট বন্ধ করা যাবে না");
    }

    return prisma.$transaction(async (tx) => {
        const user = await tx.admin.update({ where: { id }, data: payload, select: userSelect });
        // Switched off: log them out everywhere right now.
        if (payload.is_active === false) await tx.session.deleteMany({ where: { admin_id: id } });
        return user;
    });
};

// For a forgotten password: sets a new one and logs that person out everywhere.
const resetPassword = async (id: string, payload: IResetPasswordPayload, me: IRequestUser) => {
    await findUserOrThrow(id);
    const hash = await bcrypt.hash(payload.password, PASSWORD_SALT_ROUNDS);
    await prisma.$transaction([
        prisma.admin.update({ where: { id }, data: { password_hash: hash } }),
        prisma.session.deleteMany({
            where: { admin_id: id, ...(id === me.adminId ? { id: { not: me.sessionId } } : {}) },
        }),
    ]);
    return null;
};

const deleteUser = async (id: string, me: IRequestUser) => {
    const user = await findUserOrThrow(id);
    if (id === me.adminId) throw new AppError(status.BAD_REQUEST, "নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না");
    if (user.role === "super_admin") {
        const supers = await prisma.admin.count({ where: { role: "super_admin" } });
        if (supers <= 1) throw new AppError(status.BAD_REQUEST, "শেষ সুপার অ্যাডমিন মুছে ফেলা যাবে না");
    }
    await prisma.admin.delete({ where: { id } }); // sessions cascade
    return null;
};

export const UserService = {
    getAllUsers,
    createUser,
    updateUser,
    resetPassword,
    deleteUser,
};
