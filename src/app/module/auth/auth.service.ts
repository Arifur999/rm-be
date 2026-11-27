import bcrypt from "bcryptjs";
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { ensureAdmin, PASSWORD_SALT_ROUNDS } from "../../utils/seed.js";
import { createSession } from "../../utils/session.js";
import { IChangePasswordPayload, ILoginPayload, IUpdateSettingsPayload } from "./auth.validation.js";

const WRONG_LOGIN = "ইমেইল বা পাসওয়ার্ড ভুল";

// A real hash, so a wrong email costs the same bcrypt time as a wrong password.
let dummyHash: string | undefined;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash("not-a-real-password", PASSWORD_SALT_ROUNDS));

const getBusinessName = async () => {
    const setting = await prisma.setting.findUnique({ where: { id: 1 } });
    return setting?.business_name ?? "রেন্ট এ কার";
};

const publicAdmin = async (admin: { name: string; email: string; role: string }) => ({
    name: admin.name,
    email: admin.email,
    role: admin.role,
    business_name: await getBusinessName(),
});

const login = async (payload: ILoginPayload) => {
    // First login on a fresh database creates the super admin from the env.
    await ensureAdmin();

    const admin = await prisma.admin.findUnique({ where: { email: payload.email } });
    const ok = await bcrypt.compare(payload.password, admin?.password_hash ?? (await getDummyHash()));
    if (!admin || !ok) {
        throw new AppError(status.UNAUTHORIZED, WRONG_LOGIN);
    }
    // Only after the password matched, so this does not reveal which emails exist.
    if (!admin.is_active) {
        throw new AppError(status.FORBIDDEN, "এই অ্যাকাউন্ট বন্ধ করা আছে");
    }

    const { token, expiresAt } = await createSession(admin.id);
    return { token, expires_at: expiresAt, admin: await publicAdmin(admin) };
};

const logout = async (user: IRequestUser) => {
    await prisma.session.deleteMany({ where: { id: user.sessionId } });
    return null;
};

const getMe = async (user: IRequestUser) => {
    const admin = await prisma.admin.findUnique({ where: { id: user.adminId } });
    if (!admin) throw new AppError(status.UNAUTHORIZED, "আবার লগইন করুন");
    return publicAdmin(admin);
};

// Signs out every other device; the one making the change stays logged in.
const changePassword = async (payload: IChangePasswordPayload, user: IRequestUser) => {
    const admin = await prisma.admin.findUnique({ where: { id: user.adminId } });
    if (!admin) throw new AppError(status.UNAUTHORIZED, "আবার লগইন করুন");

    const ok = await bcrypt.compare(payload.current_password, admin.password_hash);
    if (!ok) throw new AppError(status.BAD_REQUEST, "বর্তমান পাসওয়ার্ড ভুল");

    await prisma.$transaction([
        prisma.admin.update({
            where: { id: admin.id },
            data: { password_hash: await bcrypt.hash(payload.new_password, PASSWORD_SALT_ROUNDS) },
        }),
        prisma.session.deleteMany({ where: { admin_id: admin.id, id: { not: user.sessionId } } }),
    ]);
    return null;
};

// The business name is shared by every login.
const updateSettings = async (payload: IUpdateSettingsPayload, user: IRequestUser) => {
    await prisma.setting.upsert({
        where: { id: 1 },
        create: { id: 1, business_name: payload.business_name },
        update: { business_name: payload.business_name },
    });
    return getMe(user);
};

export const AuthService = {
    login,
    logout,
    getMe,
    changePassword,
    updateSettings,
};
