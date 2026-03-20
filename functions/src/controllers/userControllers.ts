import {Request, Response} from "express";
import {logger} from "firebase-functions";
import admin from "firebase-admin";
import {getHackitbaDb} from "../helpers/getDb";
import {
  registerUser,
  eventRegistration,
  loginUser,
  getAllUsers,
  getUserByIdComplete,
  updateUserData,
} from "../services/userService";
import {getTeamByLabel} from "../services/teamService";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTeamAssignmentAcceptedEmail,
  sendTeamAssignmentRejectedEmail,
  sendEmailVerificationEmail,
  sendCustomEmail,
  sendIncompleteRegistrationEmail,
} from "../services/emailService";
import {
  generateVerificationToken,
  saveVerificationToken,
} from "../services/emailVerificationService";
import {
  generatePasswordResetToken,
  savePasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
} from "../services/passwordResetService";
import {getAllowedClosedSignupRole, isSignupEnabled} from "../helpers/signupGate";

interface RegisterRequestBody {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  collaboratorRoute?: boolean;
}

const getCollaboratorNamesFromCollections = async (email: string): Promise<{name: string; surname: string} | null> => {
  const db = getHackitbaDb();

  const emailCandidates = Array.from(new Set([email, email.toLowerCase(), email.toUpperCase()]));
  for (const emailCandidate of emailCandidates) {
    const judgesSnapshot = await db.collection("judges").where("email", "==", emailCandidate).limit(1).get();
    if (!judgesSnapshot.empty) {
      const fullName = String(judgesSnapshot.docs[0].data()?.name || "").trim();
      if (fullName) {
        const [name, ...rest] = fullName.split(/\s+/);
        return {name, surname: rest.join(" ")};
      }
    }

    const mentorsSnapshot = await db.collection("mentors").where("email", "==", emailCandidate).limit(1).get();
    if (!mentorsSnapshot.empty) {
      const fullName = String(mentorsSnapshot.docs[0].data()?.name || "").trim();
      if (fullName) {
        const [name, ...rest] = fullName.split(/\s+/);
        return {name, surname: rest.join(" ")};
      }
    }
  }

  const normalizedTarget = email.trim().toLowerCase();

  const judgesAll = await db.collection("judges").get();
  for (const judgeDoc of judgesAll.docs) {
    const rawEmail = String(judgeDoc.data()?.email || "").trim().toLowerCase();
    if (rawEmail !== normalizedTarget) continue;

    const fullName = String(judgeDoc.data()?.name || "").trim();
    if (fullName) {
      const [name, ...rest] = fullName.split(/\s+/);
      return {name, surname: rest.join(" ")};
    }
  }

  const mentorsAll = await db.collection("mentors").get();
  for (const mentorDoc of mentorsAll.docs) {
    const rawEmail = String(mentorDoc.data()?.email || "").trim().toLowerCase();
    if (rawEmail !== normalizedTarget) continue;

    const fullName = String(mentorDoc.data()?.name || "").trim();
    if (fullName) {
      const [name, ...rest] = fullName.split(/\s+/);
      return {name, surname: rest.join(" ")};
    }
  }

  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const register = async (
  req: Request<Record<string, never>, Record<string, never>, RegisterRequestBody>,
  res: Response
) => {
  try {
    const {email, password, name, surname, collaboratorRoute} = req.body;
    const normalizedEmail = email?.trim()?.toLowerCase();

    if (!normalizedEmail || !password) {
      return res
        .status(400)
        .json({error: "Faltan campos obligatorios"});
    }

    const signupEnabled = await isSignupEnabled();
    const allowedRole = await getAllowedClosedSignupRole(normalizedEmail);

    if (!signupEnabled) {
      if (!allowedRole) {
        return res.status(403).json({
          error: "Las inscripciones estan cerradas. Esta ruta solo permite mentores y jurados con email habilitado.",
        });
      }
    }

    if (collaboratorRoute && !allowedRole) {
      return res.status(403).json({
        error: "Esta ruta solo permite mentores y jurados con email habilitado.",
      });
    }

    let resolvedName = (name || "").trim();
    let resolvedSurname = (surname || "").trim();

    if (!resolvedName && (allowedRole || collaboratorRoute)) {
      const namesFromCollection = await getCollaboratorNamesFromCollections(normalizedEmail);
      if (namesFromCollection) {
        resolvedName = namesFromCollection.name;
        resolvedSurname = namesFromCollection.surname;
      }
    }

    if (!resolvedName) {
      return res.status(400).json({error: "Faltan campos obligatorios"});
    }

    const result = await registerUser({
      email: normalizedEmail,
      password,
      name: resolvedName,
      surname: resolvedSurname,
    });

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const appUrl = process.env.APP_URL || "https://hackitba.com.ar";
    const verificationLink = `${appUrl}/es/auth/verify-email?token=${verificationToken}`;

    // Save verification token
    try {
      await saveVerificationToken(result.uid, normalizedEmail, verificationToken);
    } catch (tokenError) {
      logger.error("Error saving verification token:", tokenError);
    }

    // Send email verification email
    try {
      await sendEmailVerificationEmail(normalizedEmail, verificationLink);
    } catch (emailError) {
      logger.error("Error sending verification email:", emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      uid: result.uid,
      email: result.email,
      token: result.token,
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    logger.error("Register error:", err);
    if (err.code === "auth/email-already-exists") {
      return res.status(400).json({error: "El email ya está registrado"});
    }

    return res.status(500).json({error: err.message || "Error interno al registrar usuario"});
  }
};

export const registerEvent = async (req: Request, res: Response) => {
  try {
    // Accept both snake_case and camelCase from clients
    // eslint-disable-next-line camelcase
    const {
      userId,
      dni,
      university,
      career,
      age,
      // link_cv / linkCv
      linkCv,
      link_cv,
      linkedin,
      instagram,
      twitter,
      github,
      team,
      hasTeam,
      // food_preference / foodPreference
      foodPreference,
      food_preference,
      // categories
      category1,
      category_1,
      category2,
      category_2,
      category3,
      category_3,
      company,
      position,
      photo,
      wantsToCreateTeam,
      neighborhood,
      careerYear,
      career_year,
      grad_year,
    } = req.body;

    logger.info(`RegisterEvent called with userId: ${userId}`);
    logger.info("Request body:", req.body);

    // Get user BEFORE registration to check if this is first-time completion
    const userBefore = await getUserByIdComplete(userId);
    const previousOnboardingStep = (userBefore as any)?.onboardingStep || 0;

    await eventRegistration(
      userId,
      dni,
      university,
      career,
      age,
      // prefer snake_case if provided (received from some clients), otherwise camelCase
      (link_cv as string | null) ?? (linkCv as string | null) ?? null,
      linkedin ?? null,
      instagram ?? null,
      twitter ?? null,
      github ?? null,
      team ?? null,
      typeof hasTeam === "boolean" ? hasTeam : !!hasTeam,
      (food_preference as string) ?? (foodPreference as string) ?? "",
      (category_1 as number) ?? (category1 as number) ?? null,
      (category_2 as number) ?? (category2 as number) ?? null,
      (category_3 as number) ?? (category3 as number) ?? null,
      company ?? null,
      position ?? null,
      photo ?? null,
      typeof wantsToCreateTeam === "boolean" ? wantsToCreateTeam : !!wantsToCreateTeam,
      (neighborhood as string | null) ?? null,
      (careerYear as number | null) ?? (career_year as number | null) ?? (grad_year as number | null) ?? null
    );

    // Send welcome email ONLY on first-time completion (transition from step < 2 to step 2)
    if (Number(previousOnboardingStep) < 2) {
      const user = await getUserByIdComplete(userId);
      if (user) {
        try {
          const userData = user as {email: string; name: string; role: string};
          logger.info(`Sending welcome email to ${userData.email} (first-time completion)`);
          await sendWelcomeEmail(userData.email, userData.name);
        } catch (emailError) {
          logger.error("Error sending welcome email:", emailError);
          // Don't fail the request if email fails
        }
      }
    } else {
      logger.info(`Welcome email NOT sent - user already completed registration (previous step: ${previousOnboardingStep})`);
    }

    logger.info(`Event registration successful for userId: ${userId}`);
    return res.status(200).json({message: "Registro al evento exitoso"});
  } catch (error) {
    const err = error as Error;
    logger.error("RegisterEvent error:", err.message || err);
    if (err.message === "El equipo especificado no existe") {
      return res.status(404).json({error: err.message});
    }
    if (err.message === "Faltan campos obligatorios") {
      return res.status(400).json({error: err.message});
    }
    return res.status(500).json({error: "Error interno al registrar al evento", details: err.message});
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({error: "Faltan campos obligatorios"});
    }

    const result = await loginUser(email, password);

    return res.status(200).json({
      message: "Login successful",
      uid: result.uid,
      email: result.email,
      token: result.token,
    });
  } catch (error) {
    return res.status(500).json({error: "Error interno al iniciar sesión"});
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({users});
  } catch (error) {
    return res.status(500).json({error: "Error al obtener usuarios"});
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const {id} = req.params;

    if (!id) {
      return res.status(400).json({error: "ID de usuario no proporcionado"});
    }

    const user = await getUserByIdComplete(id);

    if (!user) {
      return res.status(404).json({error: "Usuario no encontrado"});
    }

    return res.status(200).json({user});
  } catch (error) {
    return res.status(500).json({error: "Error al obtener usuario"});
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const {id} = req.params;
    const {name, surname, email, teamLabel} = req.body;
    const requesterId = req.user.uid;

    if (!id) {
      return res.status(400).json({error: "ID de usuario no proporcionado"});
    }

    // Get user data
    const user = await getUserByIdComplete(id);
    if (!user) {
      return res.status(404).json({error: "Usuario no encontrado"});
    }

    // Verify permissions: must be admin of the team
    if (teamLabel) {
      const team = await getTeamByLabel(teamLabel);
      if (!team) {
        return res.status(404).json({error: "Equipo no encontrado"});
      }
      if (team.data?.admin_id !== requesterId) {
        return res.status(403).json({error: "No tienes permiso para editar este miembro"});
      }
    } else if (requesterId !== id) {
      // If no teamLabel provided, user can only edit themselves
      return res.status(403).json({error: "No tienes permiso para editar este usuario"});
    }

    const updates: {name?: string; surname?: string; email?: string} = {};
    if (name) updates.name = name;
    if (surname) updates.surname = surname;
    if (email) updates.email = email;

    await updateUserData(id, updates);

    return res.status(200).json({
      message: "Usuario actualizado exitosamente",
      user: {
        ...user,
        ...updates,
      },
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    logger.error("Update user error:", err);
    return res.status(500).json({error: "Error al actualizar usuario"});
  }
};

export const resetEventSignup = async (req: Request, res: Response) => {
  try {
    const {id} = req.params;
    const requesterId = req.user?.uid;

    if (!id) {
      return res.status(400).json({error: "ID de usuario no proporcionado"});
    }

    if (!requesterId) {
      return res.status(401).json({error: "No autenticado"});
    }

    const db = getHackitbaDb();

    // Allow self-service reset. Admins can also execute it for any participant.
    if (requesterId !== id) {
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : null;
      if (requesterRole !== "admin") {
        return res.status(403).json({error: "No tienes permiso para realizar esta acción"});
      }
    }

    const result = await db.runTransaction(async (tx) => {
      const userRef = db.collection("users").doc(id);
      const userDoc = await tx.get(userRef);

      if (!userDoc.exists) {
        const err: any = new Error("Usuario no encontrado");
        err.status = 404;
        throw err;
      }

      const userData = userDoc.data() || {};
      const currentTeam = (userData.team as string | null) || null;
      let teamDeleted = false;

      if (currentTeam) {
        const teamRef = db.collection("teams").doc(currentTeam);
        const teamDoc = await tx.get(teamRef);

        if (teamDoc.exists) {
          const membersQuery = db.collection("users").where("team", "==", currentTeam);
          const membersSnapshot = await tx.get(membersQuery as any);
          const memberIds = membersSnapshot.docs.map((d) => d.id);

          // If user is the only member, delete empty team.
          if (memberIds.length <= 1) {
            tx.delete(teamRef);
            teamDeleted = true;
          } else {
            // Keep team, but remove member id from participantIds if that array exists.
            tx.update(teamRef, {
              participantIds: admin.firestore.FieldValue.arrayRemove(id),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }

      tx.update(userRef, {
        onboardingStep: 1,
        team: null,
        hasTeam: false,
        wantsToCreateTeam: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {teamDeleted, previousTeam: currentTeam};
    });

    return res.status(200).json({
      message: "Inscripción reiniciada correctamente",
      onboardingStep: 1,
      teamDeleted: result.teamDeleted,
      previousTeam: result.previousTeam,
    });
  } catch (error: any) {
    logger.error("Reset event signup error:", error);
    if (error?.status) {
      return res.status(error.status).json({error: error.message});
    }
    return res.status(500).json({error: "Error al reiniciar la inscripción"});
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const {email} = req.body;

    if (!email) {
      return res.status(400).json({error: "El email es obligatorio"});
    }

    // Buscar usuario por email en Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch {
      // No revelar si el email existe — siempre responder con 200
      return res.status(200).json({message: "Si el email está registrado, recibirás un link para resetear tu contraseña"});
    }

    const token = generatePasswordResetToken();
    const appUrl = process.env.APP_URL || "https://hackitba.com.ar";
    // El link apunta a la página frontend de reset-password
    const resetLink = `${appUrl}/es/auth/reset-password?token=${token}`;

    await savePasswordResetToken(userRecord.uid, email, token);

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (emailError) {
      logger.error("Error sending password reset email:", emailError);
      return res.status(500).json({error: "Error al enviar el email de reseteo"});
    }

    return res.status(200).json({message: "Si el email está registrado, recibirás un link para resetear tu contraseña"});
  } catch (error) {
    logger.error("Password reset error:", error);
    return res.status(500).json({error: "Error al procesar el reseteo de contraseña"});
  }
};

export const confirmPasswordReset = async (req: Request, res: Response) => {
  try {
    const {token, newPassword} = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({error: "Token y nueva contraseña son obligatorios"});
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({error: "La contraseña debe tener al menos 6 caracteres"});
    }

    const tokenData = await verifyPasswordResetToken(token);

    if (!tokenData) {
      // 410 Gone — token expirado o no encontrado
      return res.status(410).json({error: "El link de reseteo es inválido o expiró. Solicitá uno nuevo."});
    }

    // Actualizar contraseña en Firebase Auth
    await admin.auth().updateUser(tokenData.userId, {password: newPassword});

    // Consumir token para que no pueda usarse de nuevo
    await consumePasswordResetToken(token);

    logger.info(`Password reset successful for user ${tokenData.userId}`);
    return res.status(200).json({message: "Contraseña actualizada exitosamente"});
  } catch (error) {
    logger.error("Confirm password reset error:", error);
    return res.status(500).json({error: "Error al actualizar la contraseña"});
  }
};

/**
 * Approve participant and assign team
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const approveParticipantAndAssignTeam = async (req: Request, res: Response) => {
  try {
    const {userId, teamCode, status, reason} = req.body;

    if (!userId || !status) {
      return res.status(400).json({error: "userId and status are required"});
    }

    if (status === "accepted" && !teamCode) {
      return res.status(400).json({error: "teamCode is required when status is accepted"});
    }

    const db = getHackitbaDb();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    const userData = userDoc.data();
    const userName = userData?.name || "Participante";
    const userEmail = userData?.email;

    const updateData: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (status === "rejected") {
      updateData.participationStatus = "rejected";
      updateData.status = "rejected";
    } else if (status === "accepted") {
      updateData.participationStatus = null;
      updateData.status = "accepted";
    }

    let teamName = "";

    if (status === "accepted" && teamCode) {
      // Verify team exists
      const teamDoc = await db.collection("teams").doc(teamCode).get();
      if (!teamDoc.exists) {
        return res.status(404).json({error: "Team not found"});
      }

      const teamData = teamDoc.data();
      teamName = teamData?.name || teamCode;

      // Check if team is empty (no members yet, or admin_id is "admin-created")
      const isEmptyTeam = !teamData?.admin_id || teamData.admin_id === "admin-created";

      // If team is empty, make this user the admin
      if (isEmptyTeam) {
        await db.collection("teams").doc(teamCode).update({
          admin_id: userId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`User ${userId} set as admin of empty team ${teamCode}`);
      }

      updateData.team = teamCode;
      updateData.hasTeam = true;
    }

    await userRef.update(updateData);

    // Send notification email
    if (userEmail) {
      try {
        if (status === "accepted") {
          await sendTeamAssignmentAcceptedEmail(userEmail, userName, teamName);
        } else if (status === "rejected") {
          await sendTeamAssignmentRejectedEmail(userEmail, userName, reason);
        }
      } catch (emailError) {
        logger.error("Error sending notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return res.status(200).json({
      message: "Participant status updated successfully",
      userId,
      status,
      teamCode: status === "accepted" ? teamCode : null,
    });
  } catch (error) {
    logger.error("Error approving participant:", error);
    return res.status(500).json({error: "Error approving participant"});
  }
};

/**
 * Get pending participants (in_process status)
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const getPendingParticipants = async (req: Request, res: Response) => {
  try {
    logger.info("Getting pending participants...");
    const db = getHackitbaDb();
    const usersSnapshot = await db.collection("users")
      .where("hasTeam", "==", false)
      .get();

    logger.info(`Found ${usersSnapshot.size} pending participants`);

    const allParticipants = usersSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return data.participationStatus !== "rejected" && Number(data.onboardingStep ?? 0) >= 2;
      })
      .map((doc) => {
        const data = doc.data();
        logger.info(`Participant: ${doc.id} - ${data.name} ${data.surname}`);
        return {
          id: doc.id,
          name: data.name,
          surname: data.surname,
          email: data.email,
          university: data.university,
          career: data.career,
          age: data.age,
          food_preference: data.food_preference,
          category_1: data.category_1 ?? null,
          category_2: data.category_2 ?? null,
          category_3: data.category_3 ?? null,
          createdAt: data.createdAt,
        };
      });

    const total = allParticipants.length;
    const pageSize = Math.max(1, parseInt(String(req.query.pageSize ?? "5"), 10));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, parseInt(String(req.query.page ?? "1"), 10)), totalPages);
    const participants = allParticipants.slice((page - 1) * pageSize, page * pageSize);

    logger.info(`Returning page ${page}/${totalPages} (${participants.length}/${total} participants)`);

    return res.status(200).json({
      participants,
      count: total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    logger.error("Error getting pending participants:", error);
    return res.status(500).json({error: "Error getting pending participants"});
  }
};
/**
 * Get users who have not completed registration (onboardingStep < 2)
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const getIncompleteUsers = async (req: Request, res: Response) => {
  try {
    logger.info("Getting incomplete users (onboardingStep < 2)...");
    const db = getHackitbaDb();
    const usersSnapshot = await db.collection("users").get();

    const allIncompleteUsers = usersSnapshot.docs
      .filter((doc) => Number(doc.data().onboardingStep ?? 0) < 2)
      .map((doc) => {
        const data = doc.data();
        const raw = data.createdAt;
        let createdAtStr: string | null = null;
        if (raw) {
          try {
            if (typeof raw.toDate === "function") {
              // Firestore Timestamp instance
              createdAtStr = raw.toDate().toISOString();
            } else if (raw._seconds !== undefined) {
              // Plain object { _seconds, _nanoseconds }
              createdAtStr = new Date(raw._seconds * 1000).toISOString();
            } else if (raw.seconds !== undefined) {
              // Plain object { seconds, nanoseconds }
              createdAtStr = new Date(raw.seconds * 1000).toISOString();
            } else if (typeof raw === "string" || typeof raw === "number") {
              const d = new Date(raw);
              createdAtStr = isNaN(d.getTime()) ? null : d.toISOString();
            }
          } catch (e) {
            logger.warn("Could not parse createdAt:", raw);
          }
        }
        // Parse incompleteMailLastSent the same way as createdAt
        const rawMailSent = data.incompleteMailLastSent;
        let incompleteMailLastSentStr: string | null = null;
        if (rawMailSent) {
          try {
            if (typeof rawMailSent.toDate === "function") {
              incompleteMailLastSentStr = rawMailSent.toDate().toISOString();
            } else if (rawMailSent._seconds !== undefined) {
              incompleteMailLastSentStr = new Date(rawMailSent._seconds * 1000).toISOString();
            } else if (rawMailSent.seconds !== undefined) {
              incompleteMailLastSentStr = new Date(rawMailSent.seconds * 1000).toISOString();
            }
          } catch (e) {/* ignore */}
        }
        return {
          id: doc.id,
          name: data.name ?? null,
          surname: data.surname ?? null,
          email: data.email ?? null,
          emailVerified: data.emailVerified ?? false,
          onboardingStep: data.onboardingStep ?? 0,
          createdAt: createdAtStr,
          incompleteMailCount: data.incompleteMailCount ?? 0,
          incompleteMailLastSent: incompleteMailLastSentStr,
        };
      });

    const total = allIncompleteUsers.length;
    const pageSize = Math.max(1, parseInt(String(req.query.pageSize ?? "5"), 10));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, parseInt(String(req.query.page ?? "1"), 10)), totalPages);
    const users = allIncompleteUsers.slice((page - 1) * pageSize, page * pageSize);

    logger.info(`Returning page ${page}/${totalPages} (${users.length}/${total} incomplete users)`);

    return res.status(200).json({
      users,
      count: total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    logger.error("Error getting incomplete users:", error);
    return res.status(500).json({error: "Error getting incomplete users"});
  }
};

/**
 * Verify email with token
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const {token} = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({error: "Token de verificación requerido"});
    }

    const {verifyEmailToken, markTokenAsVerified} = await import(
      "../services/emailVerificationService.js"
    );

    const tokenData = await verifyEmailToken(token);
    if (!tokenData) {
      return res.status(400).json({error: "Token inválido o expirado"});
    }

    await markTokenAsVerified(token, tokenData.userId);

    // ...existing code...

    return res.status(200).json({
      message: "Email verificado exitosamente",
      email: tokenData.email,
    });
  } catch (error) {
    logger.error("Error verifying email:", error);
    return res.status(500).json({error: "Error al verificar email"});
  }
};
/**
 * Resend email verification
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const {email} = req.body;

    if (!email) {
      return res.status(400).json({error: "Email requerido"});
    }

    const {generateVerificationToken, saveVerificationToken} = await import(
      "../services/emailVerificationService.js"
    );

    // Find user by email
    const db = getHackitbaDb();
    const usersSnapshot = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(404).json({error: "Usuario no encontrado"});
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const appUrl = process.env.APP_URL || "https://hackitba.com.ar";
    const verificationLink = `${appUrl}/es/auth/verify-email?token=${verificationToken}`;

    // Save verification token
    try {
      await saveVerificationToken(userId, email, verificationToken);
    } catch (tokenError) {
      logger.error("Error saving verification token:", tokenError);
      return res.status(500).json({error: "Error al generar token de verificación"});
    }

    // Send email
    try {
      await sendEmailVerificationEmail(email, verificationLink);
    } catch (emailError) {
      logger.error("Error sending verification email:", emailError);
      return res.status(500).json({error: "Error al enviar email de verificación"});
    }

    return res.status(200).json({
      message: "Email de verificación reenviado",
      email: email,
    });
  } catch (error) {
    logger.error("Error resending verification email:", error);
    return res.status(500).json({error: "Error al reenviar email de verificación"});
  }
};

/**
 * Change user email and send verification
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @return {Promise<Response>} Response
 */
export const changeEmail = async (req: Request, res: Response) => {
  try {
    const {oldEmail, newEmail} = req.body;

    if (!oldEmail || !newEmail) {
      return res.status(400).json({error: "Both old and new email are required"});
    }

    if (oldEmail === newEmail) {
      return res.status(400).json({error: "New email must be different from old email"});
    }

    const {generateVerificationToken, saveVerificationToken} = await import(
      "../services/emailVerificationService.js"
    );

    const db = getHackitbaDb();

    // Find user by old email
    const usersSnapshot = await db.collection("users")
      .where("email", "==", oldEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(404).json({error: "Usuario no encontrado"});
    }

    // Check if new email is already registered
    const existingEmail = await db.collection("users")
      .where("email", "==", newEmail)
      .limit(1)
      .get();

    if (!existingEmail.empty) {
      return res.status(400).json({error: "El nuevo email ya está registrado"});
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Update email in Firebase Auth
    try {
      await admin.auth().updateUser(userId, {
        email: newEmail,
      });
      logger.info(`Email updated in Firebase Auth for user: ${userId}`);
    } catch (authError: any) {
      logger.error("Error updating email in Firebase Auth:", authError);
      if (authError.code === "auth/email-already-exists") {
        return res.status(400).json({error: "El nuevo email ya está registrado en Firebase Auth"});
      }
      throw authError;
    }

    // Update email in Firestore
    await db.collection("users").doc(userId).update({
      email: newEmail,
      emailVerified: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const appUrl = process.env.APP_URL || "https://hackitba.com.ar";
    const verificationLink = `${appUrl}/es/auth/verify-email?token=${verificationToken}`;

    // Save verification token
    try {
      await saveVerificationToken(userId, newEmail, verificationToken);
    } catch (tokenError) {
      logger.error("Error saving verification token:", tokenError);
      return res.status(500).json({error: "Error al generar token de verificación"});
    }

    // Send verification email to new email
    try {
      await sendEmailVerificationEmail(newEmail, verificationLink);
    } catch (emailError) {
      logger.error("Error sending verification email:", emailError);
      return res.status(500).json({error: "Error al enviar email de verificación"});
    }

    return res.status(200).json({
      message: "Email actualizado. Por favor verifica tu nuevo email.",
      email: newEmail,
    });
  } catch (error) {
    logger.error("Error changing email:", error);
    return res.status(500).json({error: "Error al cambiar email"});
  }
};

/**
 * Admin endpoint para enviar un email personalizado usando el template notification_generic.
 * @param {Request} req - Express request containing body { email, subject, body, dashboardUrl? }
 * @param {Response} res - Express response used to return status
 * @return {Promise<void>} 200 when enqueued or an error status
 */
/**
 * Get the bulk incomplete-mail log from adminConfig/incompleteMailLog
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @return {Promise<Response>} Response with lastSentAt and lastSentCount
 */
export const getIncompleteMailLog = async (req: Request, res: Response) => {
  try {
    const db = getHackitbaDb();
    const logDoc = await db.collection("adminConfig").doc("incompleteMailLog").get();
    if (!logDoc.exists) {
      return res.status(200).json({lastSentAt: null, lastSentCount: 0});
    }
    const data = logDoc.data()!;
    const raw = data.lastSentAt;
    let lastSentAtStr: string | null = null;
    if (raw) {
      try {
        if (typeof raw.toDate === "function") {
          lastSentAtStr = raw.toDate().toISOString();
        } else if (raw._seconds !== undefined) {
          lastSentAtStr = new Date(raw._seconds * 1000).toISOString();
        } else if (raw.seconds !== undefined) {
          lastSentAtStr = new Date(raw.seconds * 1000).toISOString();
        }
      } catch (e) {/* ignore */}
    }
    return res.status(200).json({
      lastSentAt: lastSentAtStr,
      lastSentCount: data.lastSentCount ?? 0,
    });
  } catch (error) {
    logger.error("Error getting incomplete mail log:", error);
    return res.status(500).json({error: "Internal server error"});
  }
};

/**
 * Send incomplete-registration reminder to ALL incomplete users
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @return {Promise<Response>} Response with sent and failed counts
 */
export const sendIncompleteReminderAll = async (req: Request, res: Response) => {
  try {
    const db = getHackitbaDb();
    const usersSnapshot = await db.collection("users").get();
    const incompleteUsers = usersSnapshot.docs
      .filter((doc) => Number(doc.data().onboardingStep ?? 0) < 2)
      .map((doc) => ({id: doc.id, ...doc.data()} as {id: string; email?: string; name?: string; incompleteMailCount?: number}));

    if (incompleteUsers.length === 0) {
      return res.status(200).json({message: "No incomplete users", sent: 0, failed: 0});
    }

    let sent = 0;
    let failed = 0;
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const user of incompleteUsers) {
      if (!user.email) continue;
      try {
        await sendIncompleteRegistrationEmail(user.email, user.name ?? null);
        const currentCount = Number(user.incompleteMailCount ?? 0);
        await db.collection("users").doc(user.id).update({
          incompleteMailCount: currentCount + 1,
          incompleteMailLastSent: now,
        });
        sent++;
      } catch (e) {
        logger.error(`Failed to send incomplete reminder to ${user.email}:`, e);
        failed++;
      }
    }

    // Update bulk log
    await db.collection("adminConfig").doc("incompleteMailLog").set({
      lastSentAt: now,
      lastSentCount: sent,
    }, {merge: true});

    logger.info(`Incomplete reminder bulk send: ${sent} sent, ${failed} failed`);
    return res.status(200).json({message: "Emails queued", sent, failed});
  } catch (error) {
    logger.error("Error in sendIncompleteReminderAll:", error);
    return res.status(500).json({error: "Internal server error"});
  }
};

/**
 * Send incomplete-registration reminder to a single user by userId
 * @param {Request} req - Express request with param userId
 * @param {Response} res - Express response
 * @return {Promise<Response>} Response with updated mail count
 */
export const sendIncompleteReminderOne = async (req: Request, res: Response) => {
  try {
    const {userId} = req.params;
    if (!userId) return res.status(400).json({error: "userId required"});

    const db = getHackitbaDb();
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({error: "User not found"});

    const userData = userDoc.data()!;
    if (!userData.email) return res.status(400).json({error: "User has no email"});

    await sendIncompleteRegistrationEmail(userData.email as string, (userData.name as string) ?? null);

    const currentCount = Number(userData.incompleteMailCount ?? 0);
    await db.collection("users").doc(userId).update({
      incompleteMailCount: currentCount + 1,
      incompleteMailLastSent: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({message: "Email queued", count: currentCount + 1});
  } catch (error) {
    logger.error("Error in sendIncompleteReminderOne:", error);
    return res.status(500).json({error: "Internal server error"});
  }
};

export const sendAdminEmail = async (req: Request, res: Response) => {
  try {
    const {email, subject, body, dashboardUrl} = req.body;

    if (!email || !subject) {
      return res.status(400).json({error: "Email and subject are required"});
    }

    try {
      // Try to load and use the notification_generic template
      const db = admin.firestore();
      const templateDoc = await db.collection("emailTemplates").doc("notification_generic").get();
      let finalHtml = body || "";
      if (templateDoc.exists) {
        const tData = templateDoc.data()!;
        const variables: Record<string, string> = {
          subject: subject || "",
          body: body || "",
          dashboardUrl: dashboardUrl || (process.env.APP_URL ? `${process.env.APP_URL}/es/dashboard` : "https://hackitba.com.ar/es/dashboard"),
        };
        let html = tData.html || "";
        Object.entries(variables).forEach(([k, v]) => {
          html = html.replace(new RegExp(`{{${k}}}`, "g"), v);
        });
        finalHtml = html;
      }
      await sendCustomEmail(email, subject, finalHtml);
    } catch (error) {
      logger.error("Error queueing admin email:", error);
      return res.status(500).json({error: "Error queueing email"});
    }

    return res.status(200).json({message: "Email queued"});
  } catch (error) {
    logger.error("Error in sendAdminEmail:", error);
    return res.status(500).json({error: "Internal server error"});
  }
};

/**
 * Admin endpoint to delete a user from Firebase Auth and Firestore.
 * @param {Request} req - Express request with param uid
 * @param {Response} res - Express response used to return status
 * @return {Promise<void>} 200 when deleted or an error status
 */
export const deleteUserByAdmin = async (req: Request, res: Response) => {
  const {uid} = req.params;
  if (!uid) return res.status(400).json({error: "UID required"});
  try {
    try {
      await admin.auth().deleteUser(uid);
    } catch (authErr: any) {
      if (authErr.code !== "auth/user-not-found") {
        logger.error("Error deleting from Auth:", authErr);
        return res.status(500).json({error: "Error deleting from Auth"});
      }
    }
    const db = getHackitbaDb();
    await db.collection("users").doc(uid).delete();
    return res.status(200).json({message: "User deleted"});
  } catch (error) {
    logger.error("Error in deleteUserByAdmin:", error);
    return res.status(500).json({error: "Internal server error"});
  }
};
