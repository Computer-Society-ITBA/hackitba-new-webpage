import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const validateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(403).json({ error: "No autorizado. Falta el token." });
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error("Error al verificar token:", error);
    res.status(403).json({ error: "Token inválido o expirado" });
    return;
  }
};