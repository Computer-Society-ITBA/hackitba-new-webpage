import {Request, Response, NextFunction} from "express";
import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {getHackitbaDb} from "../helpers/getDb";

type AllowedRole = "mentor" | "judge" | "admin";

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

/**
 * Middleware to validate that user has admin role
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {NextFunction} next - Next middleware function
 * @return {Promise<void>}
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || !req.user.uid) {
    logger.error("No user in request. Did you forget validateToken middleware?");
    res.status(401).json({error: "No autorizado"});
    return;
  }

  try {
    const db = getHackitbaDb();
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      logger.error(`User ${req.user.uid} not found in database`);
      res.status(404).json({error: "Usuario no encontrado"});
      return;
    }

    const userData = userDoc.data();
    if (userData?.role !== "admin") {
      logger.error(`User ${req.user.uid} is not an admin. Role: ${userData?.role}`);
      res.status(403).json({error: "Acceso denegado. Solo administradores."});
      return;
    }

    logger.info(`Admin access granted for ${req.user.uid}`);
    next();
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    logger.error("Error checking admin role:", err.message || err);
    res.status(500).json({error: "Error verificando permisos"});
    return;
  }
};

/**
 * Middleware to validate that user has one of the allowed roles.
 * @param {AllowedRole[]} allowedRoles Roles allowed to access endpoint.
 * @return {Function} Express middleware function.
 */
export const requireRoles = (allowedRoles: AllowedRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.user.uid) {
      logger.error("No user in request. Did you forget validateToken middleware?");
      res.status(401).json({error: "No autorizado"});
      return;
    }

    try {
      const db = getHackitbaDb();
      const userDoc = await db.collection("users").doc(req.user.uid).get();

      if (!userDoc.exists) {
        logger.error(`User ${req.user.uid} not found in database`);
        res.status(404).json({error: "Usuario no encontrado"});
        return;
      }

      const userData = userDoc.data();
      const userRole = userData?.role as AllowedRole | undefined;

      if (!userRole || !allowedRoles.includes(userRole)) {
        logger.error(`User ${req.user.uid} has no access. Role: ${userRole}`);
        res.status(403).json({error: "Acceso denegado"});
        return;
      }

      logger.info(`Role access granted for ${req.user.uid} with role ${userRole}`);
      next();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      logger.error("Error checking user role:", err.message || err);
      res.status(500).json({error: "Error verificando permisos"});
      return;
    }
  };
};
