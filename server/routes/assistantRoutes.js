import express from "express"
import { handleAssistantTask } from "../controllers/assistantController.js"
import { allowRoles } from "../middleware/roleMiddleware.js"

const router = express.Router()

// Only ADMIN or MANAGER can create/update tasks via assistant
router.post("/", allowRoles("ADMIN", "MANAGER", "MEMBER"), handleAssistantTask)

export default router