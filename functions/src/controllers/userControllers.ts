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
} from "../services/emailService";
import {
  generateVerificationToken,
  saveVerificationToken,
} from "../services/emailVerificationService";

interface RegisterRequestBody {
  email: string;
  password: string;
  name: string;
  surname?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const register = async (
  req: Request<Record<string, never>, Record<string, never>, RegisterRequestBody>,
  res: Response
) => {
  try {
    const {email, password, name, surname} = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({error: "Faltan campos obligatorios"});
    }

    const result = await registerUser({
      email,
      password,
      name,
      surname: surname || "",
    });

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const appUrl = process.env.APP_URL || "https://hackitba.com.ar";
    const verificationLink = `${appUrl}/es/auth/verify-email?token=${verificationToken}`;

    // Save verification token
    try {
      await saveVerificationToken(result.uid, email, verificationToken);
    } catch (tokenError) {
      logger.error("Error saving verification token:", tokenError);
    }

    // Send email verification email
    try {
      await sendEmailVerificationEmail(email, verificationLink);
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
    } = req.body;

    logger.info(`RegisterEvent called with userId: ${userId}`);
    logger.info("Request body:", req.body);

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
      typeof wantsToCreateTeam === "boolean" ? wantsToCreateTeam : !!wantsToCreateTeam
    );

    // Get user to send welcome email
    const user = await getUserByIdComplete(userId);
    if (user) {
      try {
        const userData = user as {email: string; name: string; role: string};
        await sendWelcomeEmail(userData.email, userData.name);
      } catch (emailError) {
        logger.error("Error sending welcome email:", emailError);
        // Don't fail the request if email fails
      }
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

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const {email} = req.body;

    if (!email) {
      return res.status(400).json({error: "Email is required"});
    }

    // Get user by email
    const users = await getAllUsers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = users.find((u: any) => u.email === email);

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({message: "If email exists, password reset link has been sent"});
    }

    // In production, generate a real reset token and store it
    // For now, we'll use a simple approach
    const resetToken = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
    const resetLink = `${process.env.APP_URL || "https://hackitba.com"}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (emailError) {
      logger.error("Error sending password reset email:", emailError);
      return res.status(500).json({error: "Error sending password reset email"});
    }

    return res.status(200).json({message: "Password reset link sent to email"});
  } catch (error) {
    logger.error("Password reset error:", error);
    return res.status(500).json({error: "Error processing password reset"});
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
    } else if (status === "accepted") {
      updateData.participationStatus = null;
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
        return {
          id: doc.id,
          name: data.name ?? null,
          surname: data.surname ?? null,
          email: data.email ?? null,
          emailVerified: data.emailVerified ?? false,
          onboardingStep: data.onboardingStep ?? 0,
          createdAt: createdAtStr,
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
