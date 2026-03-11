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

// Admin-only: equipos pendientes de aprobación (paginado)
router.get("/pending", validateToken, requireAdmin, teamController.getPendingTeams);

// Admin-only: equipos creados por admin (para dropdown de asignación)
router.get("/admin-created", validateToken, requireAdmin, teamController.getAdminTeams);

// Obtener todos los equipos
router.get("/", validateToken, teamController.getAllTeams);

// Obtener equipo por label
router.get("/:label", validateToken, teamController.getTeamByLabel);

// Actualizar equipo
router.patch("/:label", validateToken, teamController.updateTeam);

// Obtener miembros de un equipo
router.get("/:label/members", validateToken, teamController.getTeamMembers);

/* // Eliminar miembro de un equipo
router.delete("/:label/members/:userId", validateToken, teamController.removeMember); */

export default router;
