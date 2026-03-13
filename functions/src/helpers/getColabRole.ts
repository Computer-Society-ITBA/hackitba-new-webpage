import * as logger from "firebase-functions/logger";
import {getHackitbaDb} from "./getDb";

export const getColabRole = async (email: string): Promise<string | null> => {
  const db = getHackitbaDb();
  
  try {
    // Check colaborators collection first
    const colaborators = db.collection("colaborators").doc(email);
    const doc = await colaborators.get();
    if (doc.data()?.role) {
      return doc.data()?.role;
    }
    
    // Check judges collection
    const judgesSnapshot = await db.collection("judges").where("email", "==", email).limit(1).get();
    if (!judgesSnapshot.empty) {
      return "judge";
    }
    
    // Check mentors collection
    const mentorsSnapshot = await db.collection("mentors").where("email", "==", email).limit(1).get();
    if (!mentorsSnapshot.empty) {
      return "mentor";
    }
    
    return null;
  } catch (error) {
    logger.error("Error checking collaborator status:", error);
    return null;
  }
};
