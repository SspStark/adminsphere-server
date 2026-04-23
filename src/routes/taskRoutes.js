import express from 'express';
import * as taskController from '../controllers/taskController.js';
import uploadTaskFiles from '../middlewares/uploadTaskFiles.js';
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.post('/', authMiddleware, isAdmin, uploadTaskFiles.array("attachments", 5), taskController.createTask);

export default router;