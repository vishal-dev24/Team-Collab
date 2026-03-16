import Project from "../models/Project.js";
import User from "../models/User.js";

// Create project (Admin/Manager only)
export const createProject = async (req, res) => {
    try {
        const userRole = req.headers.role; // read from headers
        if (!["ADMIN", "MANAGER"].includes(userRole))
            return res.status(403).json({ message: "Access denied" });

        const { name, description } = req.body;

        // You must get teamId from backend (not client) using logged-in user
        const userId = req.headers.userid; // send userId from frontend
        if (!userId) return res.status(400).json({ message: "User ID required" });

        const user = await User.findById(userId);
        if (!user || !user.teamId) return res.status(400).json({ message: "Invalid user/team" });

        const project = new Project({
            name,
            description,
            teamId: user.teamId,
        });

        await project.save();
        res.status(201).json(project);
    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all projects for user's team
export const getProjects = async (req, res) => {
    try {
        const teamId = req.query.teamId;
        if (!teamId) return res.status(200).json([]);
        const projects = await Project.find({ teamId });
        res.status(200).json(projects);
    } catch (error) {
        console.error("Get Projects error:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update project (Admin/Manager only)
export const updateProject = async (req, res) => {
    try {
        const userId = req.headers["user-id"];
        if (!userId) return res.status(401).json({ message: "User not authenticated" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!["ADMIN", "MANAGER"].includes(user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const { name, description } = req.body;
        if (name) project.name = name;
        if (description) project.description = description;

        await project.save();
        res.status(200).json(project);
    } catch (error) {
        console.error("Update Project error:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Delete project (Admin only)
export const deleteProject = async (req, res) => {
    try {
        const userRole = req.headers.role; // read role from headers
        if (userRole !== "ADMIN") return res.status(403).json({ message: "Access denied" });

        const projectId = req.params.id;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        await Project.findByIdAndDelete(projectId); // proper modern delete
        // or: await project.deleteOne();

        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Delete project error:", error);
        res.status(500).json({ message: error.message });
    }
};