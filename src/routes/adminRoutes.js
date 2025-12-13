import express from "express";
import { createUser, updateUserByAdmin, resetUserPasswordByAdmin, deleteUserByAdmin, getAllUsers } from "../controllers/adminController.js";
import { createUserValidation, validateResult } from "../middlewares/validation.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.post("/users", authMiddleware, isAdmin, createUserValidation, validateResult, createUser);
router.patch("/users/:id", authMiddleware, isAdmin, updateUserByAdmin);
router.patch("/users/:id/password", authMiddleware, isAdmin, resetUserPasswordByAdmin);
router.delete("/users/:id", authMiddleware, isAdmin, deleteUserByAdmin);
router.get("/users", authMiddleware, isAdmin, getAllUsers);


export default router;
