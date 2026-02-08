import * as logger from "firebase-functions/logger";
import {getHackitbaDb} from "./getDb";

export const getUserById = async (userId: string): Promise<string | null> => {
  const db = getHackitbaDb();
  const users = db.collection("users").doc(userId);
  try {
    const doc = await users.get();
    return doc.data()?.email || null;
  } catch (error) {
    logger.error("Error getting user by ID:", error);
    return null;
  }
};
