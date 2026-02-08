import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin";
import * as teamService from "../services/teamService";

interface TeamRequestData {
    name: string;
    tell_why: string;
    category_1: number;
    category_2: number;
    category_3: number;
}

interface TeamResponseData {
    id: string;
    name: string;
    tell_why: string;
    category_1: number;
    category_2: number;
    category_3: number;
    status: string;
}

export const createTeam = async (req: Request, res: Response) => {
  try {
    const {name, tell_why, category_1, category_2, category_3}: TeamRequestData = req.body;

    logger.info("Received team registration data", {name, tell_why, category_1, category_2, category_3});

    // Validaciones
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        error: "El nombre del equipo debe tener al menos 3 caracteres",
      });
    }

    if (!tell_why || tell_why.trim().length < 20) {
      return res.status(400).json({
        error: "La motivación debe tener al menos 20 caracteres",
      });
    }

    // Verificar label único
    const label = teamService.createLabel(name);
    const exists = await teamService.teamExists(label);

    if (exists) {
      return res.status(400).json({
        error: "Ya existe un equipo con ese nombre",
      });
    }

    // Verificar usuario
    const userId = req.user.uid;
    const userData = await teamService.getUserById(userId);

    if (!userData) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (userData?.team) {
      return res.status(400).json({
        error: "Ya perteneces a un equipo",
      });
    }

    // Crear equipo
    const teamData: teamService.TeamData = {
      label,
      name: name.trim(),
      tell_why: tell_why.trim(),
      category_1,
      category_2,
      category_3,
      category: null,
      admin_id: userId,
      is_finalista: false,
      link_deploy: null,
      link_github: null,
      status: "registered",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const teamId = await teamService.createTeam(teamData);
    await teamService.updateUserTeam(userId, teamId);

    // Respuesta
    const response: TeamResponseData = {
      id: teamId,
      name: teamData.name,
      tell_why: teamData.tell_why,
      category_1: teamData.category_1,
      category_2: teamData.category_2,
      category_3: teamData.category_3,
      status: teamData.status,
    };

    return res.status(201).json(response);
  } catch (error: any) {
    logger.error("Error registrando equipo:", error);
    return res.status(500).json({
      error: "Error al registrar equipo",
    });
  }
};

export const getTeamByLabel = async (req: Request, res: Response) => {
  try {
    const {label} = req.params;

    const team = await teamService.getTeamByLabel(label);

    if (!team) {
      return res.status(404).json({
        error: "Equipo no encontrado",
      });
    }

    return res.status(200).json({
      id: team.id,
      ...team.data,
    });
  } catch (error: any) {
    logger.error("Error obteniendo equipo:", error);
    return res.status(500).json({
      error: "Error al obtener equipo",
    });
  }
};

export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const teams = await teamService.getAllTeams();
    return res.status(200).json(teams);
  } catch (error: any) {
    logger.error("Error obteniendo equipos:", error);
    return res.status(500).json({
      error: "Error al obtener equipos",
    });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const {label} = req.params;
    const {name, tell_why, category_1, category_2, category_3, status}: Partial<TeamRequestData & { status: string }> = req.body;

    const team = await teamService.getTeamByLabel(label);

    if (!team) {
      return res.status(404).json({
        error: "Equipo no encontrado",
      });
    }

    // Verificar permisos
    const userId = req.user.uid;
    if (team.data?.admin_id !== userId) {
      return res.status(403).json({
        error: "No tienes permiso para actualizar este equipo",
      });
    }

    // Actualizar equipo
    const updates: teamService.UpdateTeamData = {};
    if (name) updates.name = name;
    if (tell_why) updates.tell_why = tell_why;
    if (category_1) updates.category_1 = category_1;
    if (category_2) updates.category_2 = category_2;
    if (category_3) updates.category_3 = category_3;
    if (status) updates.status = status;

    await teamService.updateTeam(team.ref, updates);

    return res.status(200).json({
      id: team.id,
      ...team.data,
      ...updates,
    });
  } catch (error: any) {
    logger.error("Error actualizando equipo:", error);
    return res.status(500).json({
      error: "Error al actualizar equipo",
    });
  }
};

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const {label} = req.params;

    const team = await teamService.getTeamByLabel(label);

    if (!team) {
      return res.status(404).json({
        error: "Equipo no encontrado",
      });
    }

    const members = await teamService.getTeamMembers(team.id);

    return res.status(200).json({
      team: {
        id: team.id,
        ...team.data,
      },
      members,
    });
  } catch (error: any) {
    logger.error("Error obteniendo miembros del equipo:", error);
    return res.status(500).json({
      error: "Error al obtener miembros del equipo",
    });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const {label, userId} = req.params;

    const team = await teamService.getTeamByLabel(label);

    if (!team) {
      return res.status(404).json({
        error: "Equipo no encontrado",
      });
    }

    // Verificar permisos
    const requesterId = req.user.uid;
    if (team.data?.admin_id !== requesterId) {
      return res.status(403).json({
        error: "No tienes permiso para eliminar miembros de este equipo",
      });
    }

    await teamService.removeMemberFromTeam(userId);

    return res.status(200).json({
      message: "Miembro eliminado del equipo",
    });
  } catch (error: any) {
    logger.error("Error eliminando miembro del equipo:", error);
    return res.status(500).json({
      error: "Error al eliminar miembro del equipo",
    });
  }
};
