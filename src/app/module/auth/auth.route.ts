import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { loginLimiter } from "../../middleware/rateLimit.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AuthController } from "./auth.controller.js";
import { changePasswordZodSchema, loginZodSchema, updateSettingsZodSchema } from "./auth.validation.js";

const router = Router();

router.post("/login", loginLimiter, validateRequest(loginZodSchema), AuthController.login);
router.post("/logout", checkAuth, AuthController.logout);
router.get("/me", checkAuth, AuthController.getMe);
router.post("/change-password", checkAuth, validateRequest(changePasswordZodSchema), AuthController.changePassword);
router.patch("/settings", checkAuth, validateRequest(updateSettingsZodSchema), AuthController.updateSettings);

export const AuthRoutes = router;
