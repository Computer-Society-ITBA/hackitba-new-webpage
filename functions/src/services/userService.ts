import admin from "firebase-admin";
import {logger} from "firebase-functions";
import {getColabRole} from "../helpers/getColabRole";
import {getUserById} from "../helpers/getuserById";
import {getHackitbaDb} from "../helpers/getDb";

interface UserData {
  email: string;
  password: string;
  name: string;
  surname: string;
}

interface UserRecord {
  uid: string;
  email: string | undefined;
  token?: string;
}

export const registerUser = async (userData: UserData): Promise<UserRecord> => {
  const {email, password, name, surname} = userData;

  try {
    // Create user in Firebase Auth
    logger.info(`Creating auth user for email: ${email}`);
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: `${name} ${surname}`,
    });

    logger.info(`Auth user created with UID: ${userRecord.uid}`);

    const role = await getColabRole(email);
    logger.info(`Colab role for ${email}: ${role}`);

    const db = getHackitbaDb();
    const userRef = db.collection("users").doc(userRecord.uid);
    logger.info(`Saving user to Firestore: ${userRecord.uid}`);

    await userRef.set({
      email: userRecord.email,
      name: name,
      surname: surname,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: role || "participant",
      onboardingStep: 1,
      emailVerified: false,
    });

    logger.info(`User successfully registered: ${userRecord.uid}`);
    return {uid: userRecord.uid, email: userRecord.email};
  } catch (error) {
    logger.error(`Error in registerUser: ${error}`);
    throw error;
  }
};


// eslint-disable-next-line camelcase
// eslint-disable-next-line camelcase
export const eventRegistration = async (
  userId: string,
  dni: string,
  university: string,
  career: string,
  age: number,
  link_cv: string|null,
  linkedin: string|null,
  instagram: string|null,
  twitter: string|null,
  github: string|null,
  team: string|null,
  hasTeam: boolean,
  food_preference: string,
  category_1: number,
  category_2: number,
  category_3: number,
  company: string|null = null,
  position: string|null = null,
  photo: string|null = null): Promise<void> => {
  try {
    const db = getHackitbaDb();
    const userRef = db.collection("users").doc(userId);

    logger.info(`EventRegistration for userId: ${userId}, role determination...`);
    const email = await getUserById(userId);
    const role = await getColabRole(email || "");
    logger.info(`User ${userId} role: ${role}`);

    if (role === "mentor" || role === "judge") {
      logger.info(`Updating mentor/judge record for ${userId}`);
      if (!userId || !dni || !company || !position || !food_preference) {
        throw new Error("Faltan campos obligatorios");
      }

      // eslint-disable-next-line camelcase
      await userRef.update({
        dni: dni,
        company: company,
        position: position,
        photo: photo,
        linkedin: linkedin,
        instagram: instagram,
        twitter: twitter,
        github: github,
        food_preference: food_preference,
        onboardingStep: 2,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Mentor/judge record updated successfully for ${userId}`);
    } else {
      logger.info(`Updating participant record for ${userId}`);
      if (!userId || !dni || !age || category_1 === null ||
          category_1 === undefined || category_2 === null || category_2 === undefined ||
          category_3 === null || category_3 === undefined) {
        throw new Error("Faltan campos obligatorios");
      }

      // Si se especifica un equipo, verificar que exista
      if (team) {
        const teamDoc = await db.collection("teams").doc(team).get();
        if (!teamDoc.exists) {
          throw new Error("El equipo especificado no existe");
        }
      }

      // eslint-disable-next-line camelcase
      await userRef.update({
        dni: dni,
        university: university,
        career: career,
        age: age,
        link_cv: link_cv,
        linkedin: linkedin,
        instagram: instagram,
        twitter: twitter,
        github: github,
        team: team,
        hasTeam: hasTeam,
        food_preference: food_preference,
        category_1: category_1 !== null ? category_1 : category_1,
        category_2: category_2 !== null ? category_2 : category_2,
        category_3: category_3 !== null ? category_3 : category_3,
        onboardingStep: 2,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Participant record updated successfully for ${userId}`);
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    logger.error(`EventRegistration error for userId ${userId}:`, err.message || err);
    throw err;
  }
};

export const loginUser = async (email: string, password: string): Promise<UserRecord> => {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    return {uid: userRecord.uid, email: userRecord.email, token: customToken};
  } catch (error) {
    throw new Error("Error al iniciar sesión");
  }
};

export const getAllUsers = async (): Promise<Array<Record<string, unknown>>> => {
  const db = getHackitbaDb();
  const usersSnapshot = await db.collection("users").get();

  const users = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<Record<string, unknown>>;

  return users;
};

export const getUserByIdComplete = async (
  userId: string
): Promise<Record<string, unknown> | null> => {
  const db = getHackitbaDb();
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  return {
    id: userDoc.id,
    ...userDoc.data(),
  } as Record<string, unknown>;
};

export const updateUserData = async (
  userId: string,
  updates: {
    name?: string;
    surname?: string;
    email?: string;
  }
): Promise<void> => {
  const db = getHackitbaDb();
  const updateData: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.surname) updateData.surname = updates.surname;
  if (updates.email) {
    // If email is being updated, also update in Firebase Auth
    await admin.auth().updateUser(userId, {email: updates.email});
    updateData.email = updates.email;
  }

  await db.collection("users").doc(userId).update(updateData);
  logger.info(`User ${userId} data updated successfully`);
};
