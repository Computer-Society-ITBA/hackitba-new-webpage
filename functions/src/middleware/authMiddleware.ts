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
    // Detectar si estamos en el emulador
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true" || 
                       process.env.FIREBASE_AUTH_EMULATOR_HOST !== undefined;
    
    if (isEmulator) {
      // En el emulador, decodificar el token sin verificar la firma
      const decodedPayload = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64').toString()
      );
      
      // Verificar que tenga el uid
      if (!decodedPayload.uid) {
        res.status(403).json({ error: "Token sin uid válido" });
        return;
      }
      
      req.user = decodedPayload;
      next();
    } else {
      // En producción, verificar normalmente
      const decodedToken = await admin.auth().verifyIdToken(idToken, true);
      req.user = decodedToken;
      next();
    }
  } catch (error) {
    logger.error("Error al verificar token:", error);
    res.status(403).json({ error: "Token inválido o expirado" });
    return;
  }
};