import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { ExpenseController } from "./expense.controller.js";
import { createExpenseZodSchema, updateExpenseZodSchema } from "./expense.validation.js";

const router = Router();

router.get("/", checkAuth, ExpenseController.getAllExpenses);
router.post("/", checkAuth, validateRequest(createExpenseZodSchema), ExpenseController.createExpense);
router.patch("/:id", checkAuth, validateRequest(updateExpenseZodSchema), ExpenseController.updateExpense);
router.delete("/:id", checkAuth, ExpenseController.deleteExpense);

export const ExpenseRoutes = router;
