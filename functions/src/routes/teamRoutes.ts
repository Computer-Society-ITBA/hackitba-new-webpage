import {Router} from "express";
import * as teamController from "../controllers/teamController";
import {validateToken, requireAdmin} from "../middleware/authMiddleware";

// eslint-disable-next-line new-cap
const router = Router();

// Crear equipo
router.post("/", validateToken, teamController.createTeam);

// Unirse a un equipo con código
router.post("/:label/join", validateToken, teamController.joinTeam);

// Admin-only: actualizar status del equipo
router.patch("/:label/status", validateToken, requireAdmin, teamController.updateTeamStatusAdmin);

// Obtener equipo por label
router.get("/:label", validateToken, teamController.getTeamByLabel);

// Obtener todos los equipos
router.get("/", validateToken, teamController.getAllTeams);

// Actualizar equipo
router.patch("/:label", validateToken, teamController.updateTeam);

// Obtener miembros de un equipo
router.get("/:label/members", validateToken, teamController.getTeamMembers);

/* // Eliminar miembro de un equipo
router.delete("/:label/members/:userId", validateToken, teamController.removeMember); */

export default router;
