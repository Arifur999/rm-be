import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { DashboardController } from "./dashboard.controller.js";

const router = Router();

router.get("/", checkAuth, DashboardController.getDashboard);

export const DashboardRoutes = router;
