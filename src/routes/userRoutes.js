import express from 'express';
import { updateMe, changeMyPassword } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.patch("/me", authMiddleware, updateMe);
router.patch("/me/password", authMiddleware, changeMyPassword);

export default router;