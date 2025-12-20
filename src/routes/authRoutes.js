import express from 'express';
import { loginUser, logoutUser, getMe, forgotPassword, resetPassword, googleAuth, googleOAuthLogin } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post("/login", rateLimiter({ keyPrefix: "login", limit: 5, windowSeconds: 15 * 60 }), loginUser);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);
router.post("/forgot-password", rateLimiter({ keyPrefix: "login", limit: 3, windowSeconds: 15 * 60 }), forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/google", rateLimiter({ keyPrefix: "login", limit: 10, windowSeconds: 15 * 60 }), googleAuth);
router.get("/google/callback", rateLimiter({ keyPrefix: "login", limit: 10, windowSeconds: 15 * 60 }), googleOAuthLogin);

export default router;