import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { CarController } from "./car.controller.js";
import { createCarZodSchema, updateCarZodSchema } from "./car.validation.js";

const router = Router();

router.get("/", checkAuth, CarController.getAllCars);
router.post("/", checkAuth, validateRequest(createCarZodSchema), CarController.createCar);
router.get("/:id/summary", checkAuth, CarController.getCarSummary);
router.patch("/:id", checkAuth, validateRequest(updateCarZodSchema), CarController.updateCar);
router.delete("/:id", checkAuth, CarController.deleteCar);

export const CarRoutes = router;
