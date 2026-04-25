import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { isAdmin } from "../middlewares/isAdmin.js";
import { createUserValidation, validateResult } from "../middlewares/validation.js";
import uploadAvatar from '../middlewares/uploadAvatar.js'

import { updateMe, changeMyPassword } from '../controllers/userController.js';

import { createUser, updateUserByAdmin, resetUserPasswordByAdmin, deleteUserByAdmin, getAllUsers, getUserById, uploadUserAvatarByAdmin, deleteUserAvatarByAdmin } from "../controllers/adminController.js";
import { downloadUsersPDF } from "../controllers/pdfController.js";
import { downloadUsersExcel } from "../controllers/excelController.js";

const router = express.Router();

// Self routes
router.patch("/me", authMiddleware, updateMe);
router.patch("/me/password", authMiddleware, changeMyPassword);

// Admin routes
router.get("/reports/users-pdf", authMiddleware, isAdmin, downloadUsersPDF);
router.get("/reports/users-excel", authMiddleware, isAdmin, downloadUsersExcel);

router.post("/", authMiddleware, isAdmin, createUserValidation, validateResult, createUser);
router.get("/", authMiddleware, isAdmin, getAllUsers);
router.get("/:id", authMiddleware, isAdmin, getUserById);
router.patch("/:id", authMiddleware, isAdmin, updateUserByAdmin);
router.delete("/:id", authMiddleware, isAdmin, deleteUserByAdmin);
router.patch("/:id/password", authMiddleware, isAdmin, resetUserPasswordByAdmin);
router.patch("/:id/avatar", authMiddleware, isAdmin, uploadAvatar.single("avatar"), uploadUserAvatarByAdmin);
router.delete("/:id/avatar", authMiddleware, isAdmin, deleteUserAvatarByAdmin);

export default router;