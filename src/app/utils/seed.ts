import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";
import { env } from "../../config/env.js";
import { prisma } from "../lib/prisma.js";

export const PASSWORD_SALT_ROUNDS = 10;

/**
 * Creates the first super admin from ADMIN_EMAIL / ADMIN_PASSWORD when nobody
 * can log in yet. Never touches an existing account, so a password changed
 * from the site is not reset by a redeploy. Every other account is created by
 * the super admin on the users page.
 */
export const ensureAdmin = async (): Promise<"created" | "exists" | "missing-env"> => {
    const count = await prisma.admin.count();
    if (count > 0) return "exists";
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return "missing-env";

    await prisma.admin.create({
        data: {
            name: "সুপার অ্যাডমিন",
            email: env.ADMIN_EMAIL,
            role: "super_admin",
            password_hash: await bcrypt.hash(env.ADMIN_PASSWORD, PASSWORD_SALT_ROUNDS),
        },
    });
    return "created";
};

// `npm run seed`
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
    ensureAdmin()
        .then((result) => {
            console.log(`Admin seed: ${result}`);
            return prisma.$disconnect();
        })
        .catch(async (error) => {
            console.error("Admin seed failed:", error);
            await prisma.$disconnect();
            process.exit(1);
        });
}
