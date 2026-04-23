import * as taskService from "../services/taskService.js"

export const createTask = async (req, res) => {
    const task = await taskService.createTask(req.body, req.user?._id, req.files);
    res.status(201).json({ success: true, message: "Task Created Successfully", data: task });
}
