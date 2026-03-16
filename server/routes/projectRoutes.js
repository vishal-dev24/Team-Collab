import express from "express"
import { getProjects, createProject, updateProject, deleteProject } from "../controllers/projectController.js"
import { allowRoles } from "../middleware/roleMiddleware.js"
import { validate } from "../middleware/validate.js"
import { projectSchema } from "../validation/projectValidation.js"

const router = express.Router()

router.get("/", getProjects)
router.post("/", allowRoles("ADMIN", "MANAGER"), validate(projectSchema), createProject)
router.put("/:id", allowRoles("ADMIN", "MANAGER"), updateProject)
router.delete("/:id", allowRoles("ADMIN"), deleteProject)

export default router