import { Router } from "express";
import { checkAuth, requireRole } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { UserController } from "./user.controller.js";
import { createUserZodSchema, resetPasswordZodSchema, updateUserZodSchema } from "./user.validation.js";

const router = Router();

// Every route here is super admin only.
router.use(checkAuth, requireRole("super_admin"));

router.get("/", UserController.getAllUsers);
router.post("/", validateRequest(createUserZodSchema), UserController.createUser);
router.patch("/:id", validateRequest(updateUserZodSchema), UserController.updateUser);
router.post("/:id/reset-password", validateRequest(resetPasswordZodSchema), UserController.resetPassword);
router.delete("/:id", UserController.deleteUser);

export const UserRoutes = router;
