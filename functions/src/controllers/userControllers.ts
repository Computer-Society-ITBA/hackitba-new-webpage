import {Request, Response} from "express";
import {logger} from "firebase-functions";
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
  sendEventConfirmationEmail,
  sendPasswordResetEmail,
} from "../services/emailService";

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

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      logger.error("Error sending welcome email:", emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      message: "User registered successfully",
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
    // eslint-disable-next-line camelcase
    const {
      userId,
      dni,
      university,
      career,
      age,
      link_cv,
      linkedin,
      instagram,
      twitter,
      github,
      team,
      hasTeam,
      food_preference,
      category_1,
      category_2,
      category_3,
      company,
      position,
      photo,
    } = req.body;

    logger.info(`RegisterEvent called with userId: ${userId}`);
    logger.info("Request body:", req.body);

    await eventRegistration(
      userId,
      dni,
      university,
      career,
      age,
      link_cv,
      linkedin,
      instagram,
      twitter,
      github,
      team,
      hasTeam,
      food_preference,
      category_1,
      category_2,
      category_3,
      company,
      position,
      photo
    );

    // Get user to send confirmation email
    const user = await getUserByIdComplete(userId);
    if (user) {
      try {
        const userData = user as {email: string; name: string; role: string};
        await sendEventConfirmationEmail(userData.email, userData.name, userData.role);
      } catch (emailError) {
        logger.error("Error sending event confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    logger.info(`Event registration successful for userId: ${userId}`);
    return res.status(200).json({message: "Registro al evento exitoso"});
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
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
