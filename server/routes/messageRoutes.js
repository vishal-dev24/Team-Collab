import express from "express";
import { getMessages } from "../controllers/messageController.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Role-based history access
router.get("/", allowRoles("ADMIN", "MANAGER", "MEMBER"), getMessages);

export default router;
