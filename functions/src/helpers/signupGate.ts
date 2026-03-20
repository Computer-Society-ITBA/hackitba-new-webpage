import {logger} from "firebase-functions";
import {getColabRole} from "./getColabRole";
import {getHackitbaDb} from "./getDb";

const ENV_KEYS = ["SIGNUP_ENABLED", "NEXT_PUBLIC_SIGNUP_ENABLED"] as const;

const parseEnvBoolean = (value: string): boolean | null => {
  if (value === "1" || value.toLowerCase() === "true") {
    return true;
  }

  if (value === "0" || value.toLowerCase() === "false") {
    return false;
  }

  return null;
};

export const isSignupEnabled = async (): Promise<boolean> => {
  for (const key of ENV_KEYS) {
    const raw = process.env[key];
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = parseEnvBoolean(raw.trim());
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  try {
    const db = getHackitbaDb();
    const settingsDoc = await db.collection("settings").doc("global").get();
    if (!settingsDoc.exists) {
      return true;
    }

    return settingsDoc.data()?.signupEnabled !== false;
  } catch (error) {
    logger.error("Error loading signup setting from Firestore:", error);
    return true;
  }
};

export const getAllowedClosedSignupRole = async (email: string): Promise<"mentor" | "judge" | null> => {
  const role = await getColabRole(email);
  if (role === "mentor" || role === "judge") {
    return role;
  }

  return null;
};
