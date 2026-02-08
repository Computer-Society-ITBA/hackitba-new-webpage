import admin from "firebase-admin";
import { logger } from "firebase-functions";
import { getColabRole } from "../helpers/getColabRole";
import { getUserById } from "../helpers/getuserById";

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
  const { email, password, name, surname } = userData;

  // Create user in Firebase Auth
  const userRecord = await admin.auth().createUser({
    email: email,
    password: password,
    displayName: `${name} ${surname}`,
  });

  const customToken = await admin.auth().createCustomToken(userRecord.uid);

  const role= await getColabRole(email);
  logger.info(`Colab role for ${email}: ${role}`);
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userRecord.uid);
  await userRef.set({
    email: userRecord.email,
    name: name,
    surname: surname,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: role || "participant",
  });

  return { uid: userRecord.uid, email: userRecord.email, token: customToken };

};


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
    food_preference: string,
    category_1: number, 
    category_2: number, 
    category_3: number,
    company: string|null = null,
    position: string|null = null,
    photo: string|null = null): Promise<void> => {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userId);
        
  const email = await getUserById(userId);
  const role = await getColabRole(email || "");
  


  if (role === "mentor" || role === "judge") {

    if (!userId || !dni || !company || !position || !food_preference) {
        throw new Error("Faltan campos obligatorios");
    }
    
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {

    if (!userId || !dni || !university || !career || !age || !category_1 || !category_2 || !category_3) {
        throw new Error("Faltan campos obligatorios");
    }

    // Si se especifica un equipo, verificar que exista
    if (team) {
      const teamDoc = await db.collection("teams").doc(team).get();
      if (!teamDoc.exists) {
        throw new Error("El equipo especificado no existe");
      }
    }

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
      food_preference: food_preference,
      category_1: category_1 !== null ? category_1 : category_1,
      category_2: category_2 !== null ? category_2 : category_2,
      category_3: category_3 !== null ? category_3 : category_3,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

export const loginUser = async (email: string, password: string): Promise<UserRecord> => {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    return { uid: userRecord.uid, email: userRecord.email, token: customToken };
  } catch (error) {
    throw new Error("Error al iniciar sesión");
  }
};