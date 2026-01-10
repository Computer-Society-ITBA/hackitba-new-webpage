import { initializeApp, getApps } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig)
} else {
  firebaseApp = getApps()[0]
}

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const storage = getStorage(firebaseApp)

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const emulatorAuth = auth
  const emulatorDb = db
  const emulatorStorage = storage

  try {
    connectAuthEmulator(emulatorAuth, "http://localhost:9099", { disableWarnings: true })
    connectFirestoreEmulator(emulatorDb, "localhost", 8080)
    connectStorageEmulator(emulatorStorage, "localhost", 9199)
  } catch (error) {
    console.log("Emulators already connected or not available")
  }
}
