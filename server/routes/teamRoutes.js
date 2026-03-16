import express from "express"
// 1. getTeamById ko import karein ✅
import { getTeams, createTeam, updateTeam, deleteTeam, getTeamById } from "../controllers/teamController.js"
import { allowRoles } from "../middleware/roleMiddleware.js"
import { teamSchema } from "../validation/teamValidation.js"
import { validate } from "../middleware/validate.js"

const router = express.Router()

router.get("/", allowRoles("ADMIN", "MANAGER", "MEMBER"), getTeams)
// 2. Member/Manager ke liye specific team fetch karne ka route ✅
router.get("/:id", allowRoles("ADMIN", "MANAGER", "MEMBER"), getTeamById)

router.post("/", allowRoles("ADMIN"), validate(teamSchema), createTeam)
router.put("/:id", allowRoles("ADMIN"), validate(teamSchema), updateTeam)
router.delete("/:id", allowRoles("ADMIN"), deleteTeam)

export default router
