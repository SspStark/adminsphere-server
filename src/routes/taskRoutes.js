import express from 'express';
import * as taskController from '../controllers/taskController.js';
import uploadTaskFiles from '../middlewares/uploadTaskFiles.js';
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.post('/', authMiddleware, isAdmin, uploadTaskFiles.array("attachments", 5), taskController.createTask);
router.get('/', authMiddleware, taskController.getTasks);
router.patch('/:id', authMiddleware, taskController.updateTask);
router.delete('/:id', authMiddleware, isAdmin, taskController.deleteTask);

export default router;