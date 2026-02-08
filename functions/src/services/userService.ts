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

  return { uid: userRecord.uid, email: userRecord.email, token: customToken };
  
};



