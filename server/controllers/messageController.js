import Message from "../models/Message.js";
import { messageSchema } from "../validation/messageValidation.js";

// 1. Fetch History (Used by Frontend)
export const getMessages = async (req, res) => {
    try {
        const { teamId } = req.query;
        if (!teamId) return res.status(400).json({ message: "Team ID is required" });
        const messages = await Message.find({ teamId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Socket Message Saver with JOI Validation (Interview Requirement ✅)
export const saveSocketMessage = async (data) => {
    try {
        // Manual Joi Validation
        const { error } = messageSchema.validate(data);
        if (error) {
            console.error("Joi Validation Failed for Socket:", error.details[0].message);
            return null;
        }

        const newMessage = new Message({
            content: data.content,
            senderId: data.senderId,
            teamId: data.teamId,
            senderName: data.senderName
        });
        return await newMessage.save();
    } catch (err) {
        console.error("DB Save Error:", err.message);
        return null;
    }
};
