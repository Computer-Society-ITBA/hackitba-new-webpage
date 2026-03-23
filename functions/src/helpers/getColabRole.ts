import * as logger from "firebase-functions/logger";
import {getHackitbaDb} from "./getDb";

export const getColabRole = async (email: string): Promise<string | null> => {
  const db = getHackitbaDb();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  try {
    // Check colaborators collection first
    const colaborators = db.collection("colaborators").doc(normalizedEmail);
    const doc = await colaborators.get();

    if (!doc.exists && normalizedEmail !== email) {
      const legacyDoc = await db.collection("colaborators").doc(email).get();
      if (legacyDoc.data()?.role) {
        return legacyDoc.data()?.role;
      }
    }

    if (doc.data()?.role) {
      return doc.data()?.role;
    }

    // Check judges collection
    const judgesSnapshot = await db.collection("judges").where("email", "==", normalizedEmail).limit(1).get();
    if (!judgesSnapshot.empty) {
      return "judge";
    }

    // Fallback for legacy/dirty email values.
    const allJudges = await db.collection("judges").get();
    const hasJudge = allJudges.docs.some((judgeDoc) => {
      const rawEmail = String(judgeDoc.data()?.email || "");
      return rawEmail.trim().toLowerCase() === normalizedEmail;
    });
    if (hasJudge) {
      return "judge";
    }

    // Check mentors collection
    const mentorsSnapshot = await db.collection("mentors").where("email", "==", normalizedEmail).limit(1).get();
    if (!mentorsSnapshot.empty) {
      return "mentor";
    }

    const allMentors = await db.collection("mentors").get();
    const hasMentor = allMentors.docs.some((mentorDoc) => {
      const rawEmail = String(mentorDoc.data()?.email || "");
      return rawEmail.trim().toLowerCase() === normalizedEmail;
    });
    if (hasMentor) {
      return "mentor";
    }

    return null;
  } catch (error) {
    logger.error("Error checking collaborator status:", error);
    return null;
  }
};
