import { Server } from "http";
import app from "./app.js";
import { prisma } from "./app/lib/prisma.js";
import { ensureAdmin } from "./app/utils/seed.js";
import { env } from "./config/env.js";

// Local / VPS entry point. On Vercel, api/_handler.ts exports the app instead.
let server: Server | undefined;

const bootstrap = async () => {
    try {
        const seeded = await ensureAdmin();
        if (seeded === "missing-env") {
            console.warn("No admin yet and ADMIN_EMAIL / ADMIN_PASSWORD are not set.");
        }
        server = app.listen(env.PORT, () => {
            console.log(`Server is running on http://localhost:${env.PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

const shutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down...`);
    const done = () => prisma.$disconnect().finally(() => process.exit(0));
    if (server) server.close(done);
    else done();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
});

bootstrap();
