import express from 'express';
import { loginUser, logoutUser, getMe, forgotPassword, resetPassword, googleAuth, googleOAuthLogin } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/google", googleAuth);
router.get("/google/callback", googleOAuthLogin);

export default router;