import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore"
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const isBrowser = typeof window !== "undefined"
const hasFirebaseConfig = Boolean(firebaseConfig.apiKey)

let firebaseApp: FirebaseApp | null = null

function getFirebaseApp(): FirebaseApp | null {
  if (!isBrowser || !hasFirebaseConfig) {
    return null
  }

  if (firebaseApp) {
    return firebaseApp
  }

  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return firebaseApp
}

export function getAuthClient(): Auth | null {
  const app = getFirebaseApp()
  return app ? getAuth(app) : null
}

export function getDbClient(): Firestore | null {
  const app = getFirebaseApp()
  return app ? getFirestore(app) : null
}

export function getStorageClient(): FirebaseStorage | null {
  const app = getFirebaseApp()
  return app ? getStorage(app) : null
}

if (process.env.NODE_ENV === "development" && isBrowser && hasFirebaseConfig) {
  const emulatorAuth = getAuthClient()
  const emulatorDb = getDbClient()
  const emulatorStorage = getStorageClient()

  if (emulatorAuth && emulatorDb && emulatorStorage) {
    try {
      connectAuthEmulator(emulatorAuth, "http://localhost:9099", { disableWarnings: true })
      connectFirestoreEmulator(emulatorDb, "localhost", 8080)
      connectStorageEmulator(emulatorStorage, "localhost", 9199)
    } catch (error) {
      console.log("Emulators already connected or not available")
    }
  }
}
