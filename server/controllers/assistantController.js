export const handleAssistantTask = async (req, res) => {
    try {
        const { message, teamId, projectId } = req.body;

        // 1. Regex logic: "to [name]" ya "for [name]" dhoondhne ke liye
        const taskTitleMatch = message.match(/(?:task|titled) (.*?)(?: and| assign| to| for|$)/i);
        const taskTitle = taskTitleMatch ? taskTitleMatch[1].trim() : "New AI Task";

        const targetNameMatch = message.match(/(?:to|for) (\w+)(?:\s|$)/i);
        const targetName = targetNameMatch ? targetNameMatch[1].trim() : null;

        // 2. assignedUserId nikalna
        let assignedUserId = req.user ? req.user._id : null;

        if (targetName) {
            // Database mein user dhoondhein
            const foundUser = await User.findOne({
                name: { $regex: new RegExp(`^${targetName}$`, 'i') },
                teamId: teamId
            });

            if (foundUser) {
                assignedUserId = foundUser._id; // Den ki real ID mil gayi!
            }
        }

        // 3. Task Save (Ensure assignedTo is never undefined)
        const newTask = new Task({
            title: taskTitle,
            description: `AI Task: ${message}`,
            assignedTo: assignedUserId, // Ab yahan valid ID jayegi
            status: "todo",
            projectId,
            teamId
        });

        await newTask.save();

        res.status(201).json({
            success: true,
            message: `Task "${taskTitle}" created and assigned successfully!`
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
