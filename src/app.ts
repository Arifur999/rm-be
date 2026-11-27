import cors from "cors";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import notFound from "./app/middleware/notFound.js";
import { indexRoute } from "./app/routes/index.js";
import { env } from "./config/env.js";

const app: Application = express();

// Behind Vercel's proxy.
app.set("trust proxy", 1);
app.use(helmet());

// The browser never calls this API directly (the Next.js server does), so
// CORS only needs to allow the frontend itself, mainly for local tooling.
const allowedOrigins = env.FRONTEND_URL.split(",").map((url) => url.trim()).filter(Boolean);
app.use(
    cors({
        origin(origin, callback) {
            callback(null, !origin || allowedOrigins.includes(origin));
        },
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "1mb" }));

app.use("/api/v1", indexRoute);

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: "Rent-a-Car API is working" });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
