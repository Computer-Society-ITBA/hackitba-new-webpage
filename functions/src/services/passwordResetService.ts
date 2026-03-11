import {logger} from "firebase-functions";
import {getHackitbaDb} from "../helpers/getDb";
import admin from "firebase-admin";
import crypto from "crypto";

const COLLECTION = "passwordResetTokens";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

/**
 * Genera un token criptográfico seguro para el reseteo de contraseña
 * @return {string} Token hex aleatorio
 */
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Guarda un token de reseteo de contraseña en Firestore
 * @param {string} userId - UID del usuario
 * @param {string} email - Email del usuario
 * @param {string} token - Token de reseteo
 * @return {Promise<void>}
 */
export const savePasswordResetToken = async (
  userId: string,
  email: string,
  token: string
): Promise<void> => {
  try {
    const db = getHackitbaDb();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    // Eliminar tokens anteriores del mismo usuario para evitar acumulación
    const existing = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .get();

    const batch = db.batch();
    existing.docs.forEach((doc) => batch.delete(doc.ref));
    batch.set(db.collection(COLLECTION).doc(token), {
      userId,
      email,
      token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      used: false,
    });
    await batch.commit();

    logger.info(`Password reset token saved for user ${userId}`);
  } catch (error) {
    logger.error(`Error saving password reset token for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Verifica un token de reseteo de contraseña
 * @param {string} token - Token a verificar
 * @return {Promise} Datos del usuario (userId, email) o null si inválido/expirado
 */
export const verifyPasswordResetToken = async (
  token: string
): Promise<{userId: string; email: string} | null> => {
  try {
    const db = getHackitbaDb();
    const tokenDoc = await db.collection(COLLECTION).doc(token).get();

    if (!tokenDoc.exists) {
      logger.warn(`Password reset token not found: ${token}`);
      return null;
    }

    const data = tokenDoc.data();

    if (data?.used) {
      logger.warn(`Password reset token already used: ${token}`);
      return null;
    }

    if (data?.expiresAt?.toDate() < new Date()) {
      logger.warn(`Password reset token expired: ${token}`);
      await tokenDoc.ref.delete();
      return null;
    }

    return {userId: data?.userId, email: data?.email};
  } catch (error) {
    logger.error("Error verifying password reset token:", error);
    throw error;
  }
};

/**
 * Marca el token como usado y lo elimina de Firestore
 * @param {string} token - Token a consumir
 * @return {Promise<void>}
 */
export const consumePasswordResetToken = async (token: string): Promise<void> => {
  try {
    const db = getHackitbaDb();
    await db.collection(COLLECTION).doc(token).delete();
    logger.info(`Password reset token consumed: ${token}`);
  } catch (error) {
    logger.error("Error consuming password reset token:", error);
    throw error;
  }
};
