import {logger} from "firebase-functions";
import {getHackitbaDb} from "../helpers/getDb";
import admin from "firebase-admin";
import crypto from "crypto";

/**
 * Genera un token de verificación de email
 * @return {string} Token único para verificación
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Crea un registro de token de verificación en Firestore
 * @param {string} userId - UID del usuario
 * @param {string} email - Email del usuario
 * @param {string} token - Token de verificación
 * @return {Promise<void>}
 */
export const saveVerificationToken = async (
  userId: string,
  email: string,
  token: string
): Promise<void> => {
  try {
    const db = getHackitbaDb();
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await db.collection("emailVerificationTokens").doc(token).set({
      userId,
      email,
      token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiryTime,
      verified: false,
    });

    logger.info(`Verification token saved for user ${userId}`);
  } catch (error) {
    logger.error(`Error saving verification token for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Verifica un token de verificación de email
 * @param {string} token - Token a verificar
 * @return {(Object|null)} User data or null
 */
export const verifyEmailToken = async (
  token: string
): Promise<{userId: string; email: string} | null> => {
  try {
    const db = getHackitbaDb();
    const tokenDoc = await db.collection("emailVerificationTokens").doc(token).get();

    if (!tokenDoc.exists) {
      logger.warn(`Verification token not found: ${token}`);
      return null;
    }

    const tokenData = tokenDoc.data();

    // Verificar que no haya expirado
    if (tokenData?.expiresAt?.toDate() < new Date()) {
      logger.warn(`Verification token expired: ${token}`);
      await tokenDoc.ref.delete();
      return null;
    }

    // Verificar que no haya sido usado ya
    if (tokenData?.verified) {
      logger.warn(`Verification token already used: ${token}`);
      return null;
    }

    return {
      userId: tokenData?.userId,
      email: tokenData?.email,
    };
  } catch (error) {
    logger.error("Error verifying email token:", error);
    throw error;
  }
};

/**
 * Marca un token como verificado y actualiza el usuario
 * @param {string} token - Token a marcar
 * @param {string} userId - UID del usuario
 * @return {Promise<void>}
 */
export const markTokenAsVerified = async (token: string, userId: string): Promise<void> => {
  try {
    const db = getHackitbaDb();

    // Marcar token como verificado
    await db.collection("emailVerificationTokens").doc(token).update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Actualizar usuario
    await db.collection("users").doc(userId).update({
      emailVerified: true,
      emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Email verified for user ${userId}`);
  } catch (error) {
    logger.error(`Error marking token as verified for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Limpia tokens expirados
 * @return {Promise<void>}
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    const db = getHackitbaDb();
    const now = new Date();

    const expiredTokens = await db
      .collection("emailVerificationTokens")
      .where("expiresAt", "<", now)
      .get();

    const batch = db.batch();
    expiredTokens.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logger.info(`Cleaned up ${expiredTokens.size} expired tokens`);
  } catch (error) {
    logger.error("Error cleaning up expired tokens:", error);
  }
};

