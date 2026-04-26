import Task from "../models/Task.js";
import User from "../models/User.js";
import { TaskError } from "../errors/appError.js";
import { uploadToCloudinary } from "../integrations/imageService.js"

import constants from "../constants.js";

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

export const getTasks = async (query, user) => {
    let { page = 1, limit = 10, status, priority, assignedTo, sort = "-createdAt" } = query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Base filter
    let filter = { isDeleted: false };

    // Role based filter
    if (!constants.ADMIN_ROLES.includes(user.role)) {
        filter.assignedTo = user._id;
    } else if (assignedTo) {
        const users = assignedTo.split(',');
        filter.assignedTo = { $in: users };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Query
    const tasks = await Task.find(filter)
    .populate("assignedTo", "firstName lastName email username")
    .populate("assignedBy", "firstName lastName")
    .sort(sort)
    .skip(skip)
    .limit(limit);

    // Total Documents
    const total = await Task.countDocuments(filter);

    return { total, page, pages: Math.ceil(total/limit), data: tasks };
}

export const updateTask = async (taskId, data, user) => {
    const task = await Task.findById(taskId);
    if (!task || task.isDeleted) {
        throw new TaskError("Task not found", 400);
    }

    // Employee restriction
    if (user.role === "employee") {
        if (!task.assignedTo || task.assignedTo.toString() !== user._id.toString()) {
            throw new TaskError("Not authorised", 403);
        }

        const allowedStatus = ["pending", "in-progress", "completed"];

        if (data.status && allowedStatus.includes(data.status)) {
            task.status = data.status;
        }
    } else {
        const allowedFields = ["title", "description", "status", "priority", "dueDate"]
        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                task[field] = data[field];
            }
        });

        if (data.assignedTo !== undefined) {
            if (data.assignedTo === null) {
                data.assignedTo = null;
                data.assignedBy = null;
            } else {
                const userExists = await User.exists({ _id: data.assignedTo });
                if (!userExists) throw new TaskError("Invalid assigned user", 400);
                
                const isChanged = data.assignedTo !== task.assignedTo?.toString();
                if (isChanged) {
                    task.assignedTo = data.assignedTo;
                    task.assignedBy = user._id;
                }
            }
        }
    }

    task.updatedBy = user._id;

    await task.save();

    return task;
}

export const deleteTask = async (taskId, userId) => {
    const task = await Task.findById(taskId);

    if (!task || task.isDeleted) {
        throw new TaskError("Task not found", 404);
    }

    task.isDeleted = true;
    task.updatedBy = userId;

    await task.save();
}