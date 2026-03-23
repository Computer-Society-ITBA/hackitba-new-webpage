import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin";
import * as teamService from "../services/teamService";
import {sendCustomEmail, sendTeamNotificationEmail} from "../services/emailService";
import {getHackitbaDb} from "../helpers/getDb";

/* eslint-disable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line camelcase
interface TeamRequestData {
    name: string;
    tell_why: string;
    category_1: number | null;
    category_2: number | null;
    category_3: number | null;
    category?: number | null;
  uid?: string;
}

// eslint-disable-next-line camelcase
interface TeamResponseData {
    id: string;
    name: string;
    tell_why: string;
  category_1: number | null;
  category_2: number | null;
  category_3: number | null;
    status: string;
}

interface CreateTeamNoteRequest {
  text: string;
}

interface UpdateTeamNoteRequest {
  text: string;
}

type TeamNoteAuthorRole = "mentor" | "judge" | "admin";

interface TeamNoteAuthor {
  id: string;
  name?: string;
  surname?: string;
}

interface TeamNoteItemResponse {
  id: string;
  text: string;
  authorId: string;
  authorRole: TeamNoteAuthorRole;
  teamId: string;
  isMentorNote: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  author: TeamNoteAuthor;
}

interface TeamNotesListResponse {
  notes: TeamNoteItemResponse[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* eslint-disable-next-line camelcase */
export const createTeam = async (req: Request, res: Response) => {
  try {
    const {name, tell_why, category_1, category_2, category_3, category, uid}: TeamRequestData = req.body;

    logger.info("Received team registration data", {name, tell_why, category_1, category_2, category_3, category, uid});

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

    let creatorIsAdmin = false;

    // If the requestor is an admin using the dashboard, do not assign admin_id
    try {
      const creatorUid = req.user?.uid;
      if (creatorUid) {
        const creatorData = await teamService.getUserById(creatorUid);
        if (creatorData?.role === "admin") {
          creatorIsAdmin = true;
          adminId = null;
        }
      }
    } catch (err) {
      // If role check fails, keep previous behavior (assign adminId if provided)
      // and continue — this is non-fatal for team creation
      // eslint-disable-next-line no-console
      console.warn("Could not determine creator role:", err);
    }

    const createdByAdmin = creatorIsAdmin;

    // Crear equipo
    // eslint-disable-next-line camelcase
    const teamData: teamService.TeamData = {
      label,
      name: name.trim(),
      tell_why: tell_why.trim(),
      category_1: category_1 ?? null,
      category_2: category_2 ?? null,
      category_3: category_3 ?? null,
      category: createdByAdmin ? (typeof category === "number" ? category : null) : null,

      is_created_by_admin: createdByAdmin,
      is_finalista: false,
      link_deploy: null,
      link_github: null,
      status: createdByAdmin ? "accepted" : "registered",
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

export const updateTeamStatusAdmin = async (req: Request, res: Response) => {
  try {
    const {label} = req.params;
    const {status, category} = req.body as {status: string; category?: number | null};

    if (!status) {
      return res.status(400).json({error: "status is required"});
    }

    const team = await teamService.getTeamByLabel(label);
    if (!team) {
      return res.status(404).json({error: "Equipo no encontrado"});
    }

    const updates: teamService.UpdateTeamData = {status};
    if (category !== undefined) updates.category = category;

    await teamService.updateTeam(team.ref, updates);

    // Notify team members only for explicit approval/rejection decisions.
    if (status === "approved" || status === "rejected") {
      const db = getHackitbaDb();
      const membersSnap = await db.collection("users")
        .where("team", "==", team.id)
        .get();

      const teamName = String(team.data?.name || team.id);
      const isApproved = status === "approved";
      const subject = isApproved ? "Tu equipo fue aprobado en HackITBA" : "Actualizacion sobre tu equipo en HackITBA";

      for (const memberDoc of membersSnap.docs) {
        const member = memberDoc.data() as {email?: string; name?: string; role?: string};
        if (!member?.email) continue;
        if (member.role && member.role !== "participant") continue;

        const memberName = String(member.name || "participante");
        const heading = isApproved ? "Tu equipo fue aprobado" : "Tu equipo no fue aprobado";
        const bodyText = isApproved ?
          `Felicitaciones ${memberName}, el equipo <strong>${teamName}</strong> fue aprobado para participar en HackITBA.` :
          `Hola ${memberName}, te contamos que el equipo <strong>${teamName}</strong> no fue aprobado para esta edicion de HackITBA.`;
        const footerText = isApproved ?
          "Podes ingresar al dashboard para ver el estado actualizado y proximos pasos." :
          "Si tenes dudas, podes contactarnos por nuestros canales oficiales.";

        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:600px;margin:0 auto;">
            <h2 style="margin:0 0 16px;">${heading}</h2>
            <p>${bodyText}</p>
            <p>${footerText}</p>
            <p style="margin-top:24px;">
              <a href="https://hackitba.com.ar/es/dashboard" style="display:inline-block;background:#f97316;color:#ffffff;padding:10px 16px;text-decoration:none;border-radius:6px;">Ir al dashboard</a>
            </p>
            <p style="margin-top:24px;font-size:12px;color:#6b7280;">HackITBA - Computer Society ITBA</p>
          </div>
        `;

        try {
          await sendCustomEmail(member.email, subject, html);
        } catch (emailError) {
          logger.error("Error sending team status email:", emailError, {teamId: team.id, userId: memberDoc.id, status});
        }
      }
    }

    return res.status(200).json({id: team.id, status});
  } catch (error: any) {
    logger.error("Error actualizando status del equipo:", error);
    return res.status(500).json({error: "Error actualizando status del equipo"});
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

    // Permitir que cualquier usuario actualice el equipo

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
            wantsToCreateTeam: false,
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
        tx.update(userRef, {team: label, hasTeam: true, wantsToCreateTeam: false, updatedAt: admin.firestore.FieldValue.serverTimestamp()});
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

/**
 * Get teams pending approval (status == "registered", not created by admin)
 * Supports pagination via ?page=1&pageSize=5 query params.
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const getPendingTeams = async (req: Request, res: Response) => {
  try {
    const db = getHackitbaDb();
    const snapshot = await db.collection("teams")
      .where("status", "==", "registered")
      .get();

    const allTeams = snapshot.docs
      .map((doc) => ({id: doc.id, ...doc.data()}))
      .filter((t: any) => !t.is_created_by_admin);

    const total = allTeams.length;
    const pageSize = Math.max(1, parseInt(String(req.query.pageSize ?? "5"), 10));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, parseInt(String(req.query.page ?? "1"), 10)), totalPages);
    const teams = allTeams.slice((page - 1) * pageSize, page * pageSize);

    return res.status(200).json({teams, count: total, page, pageSize, totalPages});
  } catch (error) {
    logger.error("Error getting pending teams:", error);
    return res.status(500).json({error: "Error getting pending teams"});
  }
};

/**
 * Get all teams created by admin (for dropdowns / team assignment)
 * @param {Request} _req - Request object (unused)
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const getAdminTeams = async (_req: Request, res: Response) => {
  try {
    const db = getHackitbaDb();
    const snapshot = await db.collection("teams")
      .where("is_created_by_admin", "==", true)
      .get();

    const teams = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    return res.status(200).json({teams, count: teams.length});
  } catch (error) {
    logger.error("Error getting admin teams:", error);
    return res.status(500).json({error: "Error getting admin teams"});
  }
};

/**
 * Create a note under teams/{teamId}/notes/{noteId}.
 * Allowed roles: mentor, judge, admin.
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const createTeamNote = async (req: Request, res: Response) => {
  try {
    const {label} = req.params;
    const {text} = req.body as CreateTeamNoteRequest;
    const authorId = req.user?.uid as string | undefined;

    if (!authorId) {
      return res.status(401).json({error: "No autorizado"});
    }

    const trimmedText = typeof text === "string" ? text.trim() : "";
    if (!trimmedText) {
      return res.status(400).json({error: "text is required"});
    }

    const db = getHackitbaDb();
    const teamRef = db.collection("teams").doc(label);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) {
      return res.status(404).json({error: "Equipo no encontrado"});
    }

    const userSnap = await db.collection("users").doc(authorId).get();
    if (!userSnap.exists) {
      return res.status(404).json({error: "Usuario no encontrado"});
    }

    const rawRole = userSnap.data()?.role;
    const allowedRoles: TeamNoteAuthorRole[] = ["mentor", "judge", "admin"];
    if (!allowedRoles.includes(rawRole)) {
      return res.status(403).json({error: "Acceso denegado"});
    }

    const authorRole = rawRole as TeamNoteAuthorRole;
    const noteRef = teamRef.collection("notes").doc();

    await noteRef.set({
      text: trimmedText,
      authorId,
      authorRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      teamId: label,
      isMentorNote: authorRole === "mentor",
    });

    return res.status(201).json({
      id: noteRef.id,
      teamId: label,
      authorId,
      authorRole,
      text: trimmedText,
    });
  } catch (error: any) {
    logger.error("Error creating team note:", error);
    return res.status(500).json({error: "Error creando nota de equipo"});
  }
};

/**
 * Update a note under teams/{teamId}/notes/{noteId}.
 * Author can only edit their own notes.
 * Allowed roles: mentor, judge, admin.
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const updateTeamNote = async (req: Request, res: Response) => {
  try {
    const {label, noteId} = req.params;
    const {text} = req.body as UpdateTeamNoteRequest;
    const uid = req.user?.uid as string | undefined;

    if (!uid) {
      return res.status(401).json({error: "No autorizado"});
    }

    const trimmedText = typeof text === "string" ? text.trim() : "";
    if (!trimmedText) {
      return res.status(400).json({error: "text is required"});
    }

    const db = getHackitbaDb();
    const teamRef = db.collection("teams").doc(label);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) {
      return res.status(404).json({error: "Equipo no encontrado"});
    }

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({error: "Usuario no encontrado"});
    }

    const rawRole = userSnap.data()?.role;
    const allowedRoles: TeamNoteAuthorRole[] = ["mentor", "judge", "admin"];
    if (!allowedRoles.includes(rawRole)) {
      return res.status(403).json({error: "Acceso denegado"});
    }

    const noteRef = teamRef.collection("notes").doc(noteId);
    const noteSnap = await noteRef.get();
    if (!noteSnap.exists) {
      return res.status(404).json({error: "Nota no encontrada"});
    }

    const noteData = noteSnap.data() as {authorId?: string; teamId?: string};
    if (noteData.teamId && noteData.teamId !== label) {
      return res.status(400).json({error: "Nota invalida para este equipo"});
    }

    if (noteData.authorId !== uid) {
      return res.status(403).json({error: "Solo puedes editar tus propias notas"});
    }

    await noteRef.update({
      text: trimmedText,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      id: noteId,
      teamId: label,
      text: trimmedText,
    });
  } catch (error: any) {
    logger.error("Error updating team note:", error);
    return res.status(500).json({error: "Error actualizando nota de equipo"});
  }
};

const buildTeamNoteResponse = async (
  db: FirebaseFirestore.Firestore,
  label: string,
  page: number,
  pageSize: number,
  uid?: string
): Promise<TeamNotesListResponse> => {
  let notesQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db
    .collection("teams")
    .doc(label)
    .collection("notes");

  if (uid) {
    notesQuery = notesQuery.where("authorId", "==", uid);
  } else {
    notesQuery = notesQuery.orderBy("createdAt", "desc");
  }

  const notesSnap = await notesQuery.get();
  const notesRaw = notesSnap.docs.map((noteDoc) => ({
    id: noteDoc.id,
    ...(noteDoc.data() as {
      text?: string;
      authorId?: string;
      authorRole?: TeamNoteAuthorRole;
      teamId?: string;
      isMentorNote?: boolean;
      createdAt?: FirebaseFirestore.Timestamp;
      updatedAt?: FirebaseFirestore.Timestamp;
    }),
  }));

  const authorIds = Array.from(new Set(notesRaw.map((note) => note.authorId).filter(Boolean))) as string[];
  const authorMap = new Map<string, TeamNoteAuthor>();

  await Promise.all(
    authorIds.map(async (authorId) => {
      const userSnap = await db.collection("users").doc(authorId).get();
      if (!userSnap.exists) {
        authorMap.set(authorId, {id: authorId});
        return;
      }
      const userData = userSnap.data() as {name?: string; surname?: string};
      authorMap.set(authorId, {
        id: authorId,
        name: userData.name,
        surname: userData.surname,
      });
    })
  );

  const sortedNotes = uid ? [...notesRaw].sort((a, b) => {
    const aTime = a.createdAt ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  }) : notesRaw;

  const mappedNotes = sortedNotes.map((note) => ({
    id: note.id,
    text: note.text || "",
    authorId: note.authorId || "",
    authorRole: (note.authorRole || "mentor") as TeamNoteAuthorRole,
    teamId: note.teamId || label,
    isMentorNote: Boolean(note.isMentorNote),
    createdAt: note.createdAt ? note.createdAt.toDate().toISOString() : null,
    updatedAt: note.updatedAt ? note.updatedAt.toDate().toISOString() : null,
    author: authorMap.get(note.authorId || "") || {id: note.authorId || ""},
  }));

  const total = mappedNotes.length;
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedNotes = mappedNotes.slice((safePage - 1) * safePageSize, safePage * safePageSize);

  return {
    notes: paginatedNotes,
    count: total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
};

const parseNotesPagination = (req: Request) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.max(1, parseInt(String(req.query.pageSize ?? "10"), 10) || 10);
  return {page, pageSize};
};

/**
 * Get notes created by the authenticated user for a team.
 * Allowed roles: mentor, judge, admin.
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @return {Promise<Response>} Response
 */
export const getMyTeamNotes = async (req: Request, res: Response) => {
  try {
    const {label} = req.params;
    const uid = req.user?.uid as string | undefined;
    const {page, pageSize} = parseNotesPagination(req);

    if (!uid) {
      return res.status(401).json({error: "No autorizado"});
    }

    const db = getHackitbaDb();
    const teamSnap = await db.collection("teams").doc(label).get();
    if (!teamSnap.exists) {
      return res.status(404).json({error: "Equipo no encontrado"});
    }
    const result = await buildTeamNoteResponse(db, label, page, pageSize, uid);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error("Error getting my team notes:", error);
    return res.status(500).json({error: "Error obteniendo notas del equipo"});
  }
};

/**
 * Get all notes for a team.
 * Participants can only read notes for their own team.
 * Mentors, judges and admins can read any team notes.
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @return {Promise<Response>} Response
 */
export const getTeamNotes = async (req: Request, res: Response) => {
  try {
    const {label} = req.params;
    const uid = req.user?.uid as string | undefined;
    const {page, pageSize} = parseNotesPagination(req);

    if (!uid) {
      return res.status(401).json({error: "No autorizado"});
    }

    const db = getHackitbaDb();
    const teamSnap = await db.collection("teams").doc(label).get();
    if (!teamSnap.exists) {
      return res.status(404).json({error: "Equipo no encontrado"});
    }

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({error: "Usuario no encontrado"});
    }

    const userData = userSnap.data() as {role?: string; team?: string | null};
    const role = userData.role;
    const canReadAll = role === "mentor" || role === "judge" || role === "admin";
    const isParticipantInTeam = role === "participant" && userData.team === label;

    if (!canReadAll && !isParticipantInTeam) {
      return res.status(403).json({error: "Acceso denegado"});
    }

    const result = await buildTeamNoteResponse(db, label, page, pageSize);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error("Error getting team notes:", error);
    return res.status(500).json({error: "Error obteniendo notas del equipo"});
  }
};
