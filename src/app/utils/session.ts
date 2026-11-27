import { createHash, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { prisma } from "../lib/prisma.js";

// Sessions instead of JWT: a random token goes to the client, only its hash is
// stored. Logging out or changing the password simply deletes rows, and there
// is no signing secret to configure.

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export const createSession = async (adminId: string) => {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000);

    // Housekeeping: expired rows would otherwise only ever grow.
    await prisma.session.deleteMany({ where: { expires_at: { lt: new Date() } } });

    await prisma.session.create({
        data: { admin_id: adminId, token_hash: hashToken(token), expires_at: expiresAt },
    });

    return { token, expiresAt };
};

export const findSession = async (token: string) => {
    const session = await prisma.session.findUnique({
        where: { token_hash: hashToken(token) },
        include: { admin: { select: { id: true, email: true, role: true, is_active: true } } },
    });
    // A switched-off account loses every open login at once.
    if (!session || session.expires_at < new Date() || !session.admin.is_active) return null;
    return session;
};
