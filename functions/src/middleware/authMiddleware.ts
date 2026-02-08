import {Request, Response, NextFunction} from "express";
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
    logger.error("Missing or invalid authorization header");
    res.status(403).json({error: "No autorizado. Falta el token."});
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    // Detectar si estamos en el emulador
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true" ||
                       process.env.FIREBASE_AUTH_EMULATOR_HOST !== undefined;

    if (isEmulator) {
      // En el emulador, decodificar el token sin verificar la firma
      logger.info("Using emulator auth mode");
      const decodedPayload = JSON.parse(
        Buffer.from(idToken.split(".")[1], "base64").toString()
      );

      // Verificar que tenga el uid
      if (!decodedPayload.uid) {
        logger.error("Token missing uid");
        res.status(403).json({error: "Token sin uid válido"});
        return;
      }

      req.user = decodedPayload;
      logger.info(`Emulator auth successful for uid: ${decodedPayload.uid}`);
      next();
    } else {
      // En producción, verificar normalmente
      logger.info("Using production Firebase auth verification");
      const decodedToken = await admin.auth().verifyIdToken(idToken, true);
      req.user = decodedToken;
      logger.info(`Firebase token verified for uid: ${decodedToken.uid}`);
      next();
    }
  } catch (error: any) {
    logger.error("Error al verificar token:", error.message || error);
    res.status(403).json({
      error: "Token inválido o expirado",
      details: error.message || "Unknown error", // Solo en desarrollo
    });
    return;
  }
};
