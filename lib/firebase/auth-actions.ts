"use server"

import { adminAuth, adminDb } from "./config"
import type { UserRole } from "./types"

export async function createUserWithRole(email: string, password: string, role: UserRole, name: string) {
  try {
    const userRecord = await adminAuth().createUser({
      email,
      password,
      displayName: name,
    })

    await adminDb()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        email,
        role,
        onboardingStep: 0,
        profile: {
          name,
          bio: "",
          avatar: "",
          company: "",
          linkedin: "",
          github: "",
          twitter: "",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    return { success: true, userId: userRecord.uid }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function verifyUserSession(token: string) {
  try {
    const decodedToken = await adminAuth().verifyIdToken(token)
    return { success: true, uid: decodedToken.uid }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUserByEmail(email: string) {
  try {
    const userRecord = await adminAuth().getUserByEmail(email)
    const userDoc = await adminDb().collection("users").doc(userRecord.uid).get()

    if (!userDoc.exists) {
      return { success: false, error: "User not found" }
    }

    return {
      success: true,
      user: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
