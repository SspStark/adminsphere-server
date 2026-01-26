import express from "express";
import { createUser, updateUserByAdmin, resetUserPasswordByAdmin, deleteUserByAdmin, getAllUsers, getUserById, uploadUserAvatarByAdmin, deleteUserAvatarByAdmin } from "../controllers/adminController.js";
import { createUserValidation, validateResult } from "../middlewares/validation.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import upload from '../middlewares/upload.js'
import { downloadUsersPDF } from "../controllers/pdfController.js";
import { downloadUsersExcel } from "../controllers/excelController.js";

const router = express.Router();

router.post("/users", authMiddleware, isAdmin, createUserValidation, validateResult, createUser);
router.get("/users", authMiddleware, isAdmin, getAllUsers);
router.patch("/users/:id", authMiddleware, isAdmin, updateUserByAdmin);
router.patch("/users/:id/password", authMiddleware, isAdmin, resetUserPasswordByAdmin);
router.delete("/users/:id", authMiddleware, isAdmin, deleteUserByAdmin);
router.get("/users/:id", authMiddleware, isAdmin, getUserById);
router.patch("/users/:id/avatar", authMiddleware, isAdmin, upload.single("avatar"), uploadUserAvatarByAdmin);
router.delete("/users/:id/avatar", authMiddleware, isAdmin, deleteUserAvatarByAdmin);
router.get("/reports/users-pdf", authMiddleware, isAdmin, downloadUsersPDF);
router.get("/reports/users-excel", authMiddleware, isAdmin, downloadUsersExcel);

export default router;
