import * as logger from "firebase-functions/logger";
import {getHackitbaDb} from "./getDb";

export const getColabRole = async (email: string): Promise<string | null> => {
  const db = getHackitbaDb();
  const colaborators = db.collection("colaborators").doc(email);
  try {
    const doc = await colaborators.get();
    return doc.data()?.role || null;
  } catch (error) {
    logger.error("Error checking collaborator status:", error);
    return null;
  }
};
