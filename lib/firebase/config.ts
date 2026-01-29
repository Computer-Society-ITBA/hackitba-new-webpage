import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import { mockAuth, mockDb, mockStorage } from "./admin-mock"

const USE_MOCK = !process.env.FIREBASE_PROJECT_ID || process.env.USE_FIREBASE_MOCK === "true"

const firebaseAdminConfig = USE_MOCK ? null : {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
}

export function initAdmin() {
  if (USE_MOCK) {
    console.log("[v0] Using Firebase Admin SDK mock mode")
    return
  }

  if (getApps().length === 0) {
    if (firebaseAdminConfig) {
      initializeApp(firebaseAdminConfig)
    }
  }
}

export const adminAuth = () => {
  if (USE_MOCK) {
    return mockAuth() as any
  }
  initAdmin()
  return getAuth()
}

export const adminDb = () => {
  if (USE_MOCK) {
    return mockDb() as any
  }
  initAdmin()
  return getFirestore()
}

export const adminStorage = () => {
  if (USE_MOCK) {
    return mockStorage() as any
  }
  initAdmin()
  return getStorage()
}
