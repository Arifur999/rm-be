import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { DriverController } from "./driver.controller.js";
import { createDriverZodSchema, updateDriverZodSchema } from "./driver.validation.js";

const router = Router();

router.get("/", checkAuth, DriverController.getAllDrivers);
router.post("/", checkAuth, validateRequest(createDriverZodSchema), DriverController.createDriver);
router.get("/:id/summary", checkAuth, DriverController.getDriverSummary);
router.patch("/:id", checkAuth, validateRequest(updateDriverZodSchema), DriverController.updateDriver);
router.delete("/:id", checkAuth, DriverController.deleteDriver);

export const DriverRoutes = router;
