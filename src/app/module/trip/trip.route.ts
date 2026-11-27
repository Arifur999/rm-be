import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { TripController } from "./trip.controller.js";
import { collectTripZodSchema, createTripZodSchema, updateTripZodSchema } from "./trip.validation.js";

const router = Router();

router.get("/", checkAuth, TripController.getAllTrips);
router.post("/", checkAuth, validateRequest(createTripZodSchema), TripController.createTrip);
router.get("/:id", checkAuth, TripController.getTripById);
router.patch("/:id", checkAuth, validateRequest(updateTripZodSchema), TripController.updateTrip);
router.post("/:id/collect", checkAuth, validateRequest(collectTripZodSchema), TripController.collectDue);
router.delete("/:id", checkAuth, TripController.deleteTrip);

export const TripRoutes = router;
