import express from "express";
import { createUser } from "../controllers/adminController.js";
import { createUserValidation } from "../validators/userValidators.js";
import validateResult from "../middlewares/validateRequest.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.post("/create-user", authMiddleware, isAdmin, createUserValidation, validateResult, createUser);

export default router;
