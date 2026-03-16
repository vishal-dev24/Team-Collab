import User from "../models/User.js"; // 👈 Path check kar lena aapki file structure ke hisab se
import Task from "../models/taskModel.js";

export const handleAssistantTask = async (req, res) => {
    try {
        // req.body ya req.headers dono se data nikalne ka safe tarika
        const { message, teamId, projectId, senderId } = req.body;
        const headerUserId = req.headers.userid;

        // 1. Regex logic (Title clean karne ke liye)
        const taskTitleMatch = message.match(/(?:task|titled) (.*?)(?: and| assign| to| for|$)/i);
        const taskTitle = taskTitleMatch ? taskTitleMatch[1].trim() : "New AI Task";

        const targetNameMatch = message.match(/(?:to|for) (\w+)(?:\s|$)/i);
        const targetName = targetNameMatch ? targetNameMatch[1].trim() : null;

        // 2. Default: Jo bhej raha hai usay assign karo agar target nahi mila
        let assignedUserId = senderId || headerUserId;

        if (targetName) {
            // ✅ Ab 'User' defined hai kyunki humne upar import kiya hai
            const foundUser = await User.findOne({
                name: { $regex: new RegExp(`^${targetName}$`, 'i') },
                teamId: teamId
            });

            if (foundUser) {
                assignedUserId = foundUser._id;
            }
        }

        // 3. Task Creation
        const newTask = new Task({
            title: taskTitle,
            description: `AI Task: ${message}`,
            assignedTo: assignedUserId,
            status: "todo",
            projectId,
            teamId // Ensure Task Schema has teamId field
        });

        await newTask.save();

        res.status(201).json({
            success: true,
            message: `Task "${taskTitle}" created and assigned successfully!`
        });

    } catch (error) {
        console.error("NLP Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
