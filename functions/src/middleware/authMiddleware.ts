import {Request, Response, NextFunction} from "express";
import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user?: any;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

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
      const payload = JSON.parse(
        Buffer.from(idToken.split(".")[1], "base64").toString()
      );

      // Verificar que tenga el uid
      if (!payload.uid) {
        logger.error("Token missing uid");
        res.status(403).json({error: "Token sin uid válido"});
        return;
      }

      req.user = payload;
      logger.info(`Emulator auth successful for uid: ${payload.uid}`);
      next();
    } else {
      // En producción, verificar normalmente
      logger.info("Using production Firebase auth verification");
      const decodedToken = await admin.auth().verifyIdToken(idToken, true);
      req.user = decodedToken;
      logger.info(`Firebase token verified for uid: ${decodedToken.uid}`);
      next();
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    logger.error("Error al verificar token:", err.message || err);
    res.status(403).json({
      error: "Token inválido o expirado",
      details: err.message || "Unknown error", // Solo en desarrollo
    });
    return;
  }
};
