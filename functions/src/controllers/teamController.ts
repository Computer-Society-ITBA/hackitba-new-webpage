import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin";
import * as teamService from "../services/teamService";
import {sendTeamNotificationEmail} from "../services/emailService";

/* eslint-disable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line camelcase
interface TeamRequestData {
    name: string;
    tell_why: string;
    category_1: number;
    category_2: number;
    category_3: number;
  uid?: string;
  is_created_by_admin?: boolean;
}

// eslint-disable-next-line camelcase
interface TeamResponseData {
    id: string;
    name: string;
    tell_why: string;
    category_1: number;
    category_2: number;
    category_3: number;
    status: string;
}

/* eslint-disable-next-line camelcase */
export const createTeam = async (req: Request, res: Response) => {
  try {
    const {name, tell_why, category_1, category_2, category_3, uid, is_created_by_admin}: TeamRequestData = req.body;

    logger.info("Received team registration data", {name, tell_why, category_1, category_2, category_3, uid, is_created_by_admin});

    // Validaciones
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        error: "El nombre del equipo debe tener al menos 3 caracteres",
      });
    }

    // eslint-disable-next-line camelcase
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

    let adminId: string | null = null;
    if (uid) {
      // Verificar usuario
      const userData = await teamService.getUserById(uid);

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

      adminId = uid;
    }

    // If the requestor is an admin using the dashboard, do not assign admin_id
    try {
      const creatorUid = req.user?.uid;
      if (creatorUid) {
        const creatorData = await teamService.getUserById(creatorUid);
        if (creatorData?.role === "admin") {
          adminId = null;
        }
      }
    } catch (err) {
      // If role check fails, keep previous behavior (assign adminId if provided)
      // and continue — this is non-fatal for team creation
      // eslint-disable-next-line no-console
      console.warn("Could not determine creator role:", err);
    }

    // Crear equipo
    // eslint-disable-next-line camelcase
    const teamData: teamService.TeamData = {
      label,
      name: name.trim(),
      tell_why: tell_why.trim(),
      category_1,
      category_2,
      category_3,
      category: typeof category_1 === "number" ? category_1 : null,

      is_created_by_admin: is_created_by_admin === true,
      is_finalista: false,
      link_deploy: null,
      link_github: null,
      status: "registered",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const teamId = await teamService.createTeam(teamData);
    if (adminId) {
      await teamService.updateUserTeam(adminId, teamId);
    }

    // Respuesta
    // eslint-disable-next-line camelcase
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
    // eslint-disable-next-line camelcase
    const {
      name,
      tell_why,
      category_1,
      category_2,
      category_3,
      status,
    }: Partial<
      TeamRequestData & { status: string }
    > = req.body;

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
    // eslint-disable-next-line camelcase
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

// Eliminar miembros deshabilitado

export const joinTeam = async (req: Request, res: Response) => {
  try {
    const {label} = req.params;
    const {userId} = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const team = await teamService.getTeamByLabel(label);

    if (!team) {
      return res.status(404).json({
        error: "Team not found",
      });
    }

    // Check + add user to team inside a Firestore transaction to avoid races
    const db = admin.firestore();
    const userRef = db.collection("users").doc(userId);

    const user = await teamService.getUserById(userId);
    let authUser: admin.auth.UserRecord | null = null;
    try {
      authUser = await admin.auth().getUser(userId);
    } catch (e) {
      // ignore - user might not exist in Auth or permission to fetch may fail
      authUser = null;
    }

    try {
      await db.runTransaction(async (tx) => {
        const userDoc = await tx.get(userRef);

        // Get current members count within the transaction
        const membersQuery = db.collection("users").where("team", "==", team.id);
        const membersSnap = await tx.get(membersQuery as any);
        if (membersSnap.size >= 4) {
          const err: any = new Error("Team is full (4/4)");
          err.status = 400;
          throw err;
        }

        if (!userDoc.exists) {
          // Create a minimal user document using available profile data
          const newUserData: any = {
            team: label,
            hasTeam: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          if (user?.name) newUserData.name = user.name;
          if (user?.email) newUserData.email = user.email;
          if (!newUserData.email && authUser?.email) newUserData.email = authUser.email;
          if (!newUserData.name && authUser?.displayName) newUserData.name = authUser.displayName;

          tx.set(userRef, newUserData, {merge: true});
          return;
        }

        const userData = userDoc.data();
        if (userData?.team) {
          const err: any = new Error("You are already in a team");
          err.status = 400;
          throw err;
        }

        // Safe to add user to team
        tx.update(userRef, {team: label, hasTeam: true, updatedAt: admin.firestore.FieldValue.serverTimestamp()});
      });
    } catch (txError: any) {
      logger.error("Transaction error joining team:", txError);
      if (txError && txError.status) {
        return res.status(txError.status).json({error: txError.message});
      }
      return res.status(500).json({error: "Error joining team"});
    }

    // Send team notification email
    if (user?.email && user?.name) {
      try {
        await sendTeamNotificationEmail(
          user.email,
          user.name,
          "joined",
          team.data?.name || label,
          "You have successfully rejoined the team!"
        );
      } catch (emailError) {
        logger.error("Error sending join notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return res.status(200).json({
      message: "Successfully joined team",
      team: {
        id: team.id,
        ...team.data,
      },
    });
  } catch (error: any) {
    logger.error("Error joining team:", error);
    return res.status(500).json({
      error: "Error joining team",
    });
  }
};
