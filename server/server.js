import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import { saveSocketMessage } from "./controllers/messageController.js";

// Routes
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";

import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ================= SOCKET IO ================= */
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL, // e.g., your deployed frontend URL
        methods: ["GET", "POST"],
        credentials: true,
    },
});

/* ================= DATABASE ================= */
connectDB();

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10kb" }));

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
    res.send("API is running...");
});

/* ================= ROUTES ================= */
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/assistant", assistantRoutes);

/* ================= SOCKET EVENTS ================= */
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("joinTeam", (teamId) => {
        if (!teamId) return;
        const roomId = teamId.toString();
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("sendMessage", async (data) => {
        try {
            if (!data.teamId || !data.senderId || !data.content) return;

            const roomId = data.teamId.toString();
            const savedMsg = await saveSocketMessage(data);

            if (savedMsg) {
                io.to(roomId).emit("receiveMessage", savedMsg);
                console.log(`Message broadcasted to room ${roomId}`);
            }
        } catch (err) {
            console.error("Socket error:", err);
        }
    });

    socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

/* ================= ERROR HANDLER ================= */
app.use(errorHandler);

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});