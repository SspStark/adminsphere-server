import * as taskService from "../services/taskService.js"

export const createTask = async (req, res) => {
    const task = await taskService.createTask(req.body, req.user?._id, req.files);
    res.status(201).json({ success: true, message: "Task Created Successfully", data: task });
}

export const getTasks = async (req, res) => {
    const user = req.user
    const result = await taskService.getTasks(req.query, user);
    res.status(200).json({ success: true, ...result })
}

export const updateTask = async (req, res) => {
    const task = await taskService.updateTask(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: "Task updated successfully", data: task })
}

export const deleteTask = async (req, res) => {
    await taskService.deleteTask(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: "Task deleted successfully" });
}
