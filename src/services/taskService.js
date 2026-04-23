import Task from "../models/Task.js";
import { TaskError } from "../errors/appError.js";
import { uploadToCloudinary } from "../integrations/imageService.js";

export const createTask = async (body, userId, files = []) => {
    const { title, description, priority, dueDate, assignedTo } = body;

    if (!title) {
        throw new TaskError("Title is required", 400);
    }

    let assignedUser = null;
    if (assignedTo) {
        assignedUser = await Task.findById(assignedTo);
        if (!assignedUser) {
            throw new TaskError("Assigned user not found", 404)
        }
    }

    // Upload attachments
    const attachments = [];
    if (files.length > 0) {
        for (const file of files) {
            const result = await uploadToCloudinary(file.buffer, "adminsphere/task-attachments");
            attachments.push({
                url: result.secure_url,
                publicId: result.public_id,
                fileName: file.originalname,
                fileType: file.mimetype,
                resourceType: result.resource_type
              });
        }
    }

    // Create Task
    const task = await Task.create({
        title,
        description,
        priority,
        dueDate,
        createdBy: userId,
        assignedTo: assignedUser || null,
        assignedBy: assignedTo ? userId : null,
        attachments
    });

    return task;
}