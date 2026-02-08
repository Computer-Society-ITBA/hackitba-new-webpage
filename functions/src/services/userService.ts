import admin from "firebase-admin";

interface UserData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

interface UserRecord {
  uid: string;
  email: string | undefined;
  token?: string;
}

export const registerUser = async (userData: UserData): Promise<UserRecord> => {
  const { email, password, nombre, apellido } = userData;

  // Create user in Firebase Auth
  const userRecord = await admin.auth().createUser({
    email: email,
    password: password,
    displayName: `${nombre} ${apellido}`,
  });

  const customToken = await admin.auth().createCustomToken(userRecord.uid);

  const db = admin.firestore();
  const userRef = db.collection("users").doc(userRecord.uid);
  await userRef.set({
    email: userRecord.email,
    nombre: nombre,
    apellido: apellido,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
    category_1: number, 
    category_2: number, 
    category_3: number): Promise<void> => {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userId);

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
        category_1: category_1 !== null ? category_1 : category_1,
        category_2: category_2 !== null ? category_2 : category_2,
        category_3: category_3 !== null ? category_3 : category_3,
    });
}
