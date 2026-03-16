import express from "express"
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController.js"
import { allowRoles } from "../middleware/roleMiddleware.js"
import { validate } from "../middleware/validate.js"
import { taskSchema } from "../validation/taskValidation.js"

const router = express.Router()

// 1. Sabhi roles tasks dekh sakte hain
router.get("/", allowRoles("ADMIN", "MANAGER", "MEMBER"), getTasks)

// 2. Sirf Admin aur Manager task bana sakte hain
router.post("/", allowRoles("ADMIN", "MANAGER"), validate(taskSchema), createTask)

// 3. Status update karne ki permission MEMBER ko bhi deni hogi ✅
// Isse Den (Member) apna task drag karke status badal payega
router.put("/:id", allowRoles("ADMIN", "MANAGER", "MEMBER"), validate(taskSchema), updateTask)

// 4. Sirf Admin task delete kar sakta hai
router.delete("/:id", allowRoles("ADMIN"), deleteTask)

export default router
