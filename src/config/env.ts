import dotenv from "dotenv";

dotenv.config();

interface ENVConfig {
    NODE_ENV: string;
    PORT: string | number;
    DATABASE_URL: string;
    FRONTEND_URL: string;
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;
    SESSION_DAYS: number;
    DB_POOL_MAX: number;
}

["DATABASE_URL"].forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is not set`);
    }
});

export const env: ENVConfig = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
    SESSION_DAYS: Number(process.env.SESSION_DAYS) > 0 ? Number(process.env.SESSION_DAYS) : 30,
    DB_POOL_MAX: Number(process.env.DB_POOL_MAX) > 0 ? Number(process.env.DB_POOL_MAX) : 5,
};
