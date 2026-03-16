import Task from "../models/Task.js";
import mongoose from "mongoose";
import User from "../models/User.js";

// 1. Get all tasks - Adding .populate() to get user name/email
export const getTasks = async (req, res) => {
    try {
        const { projectId } = req.query;
        // Populate se assignedTo mein sirf ID ki jagah User ka name/email aayega
        const tasks = await Task.find({ projectId })
            .populate("assignedTo", "name email");
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Create task - Email-to-ID conversion
export const createTask = async (req, res) => {
    try {
        const { title, description, projectId, assignedTo } = req.body;

        // 1. Trim spaces aur case-insensitive search (RegExp use karke)
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${assignedTo.trim()}$`, 'i') }
        });

        if (!user) {
            // Debugging ke liye: terminal mein dikhega kya dhund rahe ho
            console.log("Input Email:", assignedTo);
            return res.status(404).json({ message: `User '${assignedTo}' not found. Please check spelling.` });
        }

        const task = new Task({
            title,
            description,
            projectId: new mongoose.Types.ObjectId(projectId),
            assignedTo: user._id,
            status: 'todo'
        });

        const savedTask = await task.save();

        // Response mein data populate karke bhejein taaki UI crash na ho
        const populatedTask = await Task.findById(savedTask._id).populate("assignedTo", "name email");

        res.status(201).json(populatedTask);
    } catch (error) {
        console.error("Task Creation Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 3. Update task
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, title, description, projectId, assignedTo } = req.body;

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        // Safely check role (Default to MEMBER if undefined) ✅
        const userRole = req.user?.role || "MEMBER";

        if (userRole === "MEMBER") {
            task.status = status || task.status;
            // Member ko sirf status badalne dein
        } else {
            if (status) task.status = status;
            if (title) task.title = title;
            if (description) task.description = description;
            if (projectId) task.projectId = projectId;
            if (assignedTo) task.assignedTo = assignedTo;
        }

        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id).populate("assignedTo", "name email");

        res.status(200).json(populatedTask);
    } catch (error) {
        console.error("Update Error:", error.message);
        res.status(400).json({ message: error.message });
    }
};

// 4. Delete task
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByIdAndDelete(id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
