import { Request, Response } from "express";
import { registerUser } from "../services/userService";

interface RegisterRequestBody {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
}

export const register = async (
  req: Request<{}, {}, RegisterRequestBody>,
  res: Response
) => {
  try {
    const { email, password, nombre, apellido } = req.body;

    if (!email || !password || !nombre) {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios" });
    }

    const result = await registerUser({
      email,
      password,
      nombre,
      apellido: apellido || "",
    });

    return res.status(201).json({
      message: "User registered successfully",
      uid: result.uid,
      email: result.email,
      token: result.token,
    });
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    return res.status(500).json({ error: "Error interno al registrar usuario" });
  }
};