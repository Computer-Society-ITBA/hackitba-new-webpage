import { collection, doc, getDoc, getDocs, query, where, type Firestore } from "firebase/firestore"

export type CollaboratorRole = "mentor" | "judge" | null

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function loadSignupEnabled(db: Firestore | null): Promise<boolean> {
  const envVal = process.env.NEXT_PUBLIC_SIGNUP_ENABLED
  if (typeof envVal !== "undefined" && envVal !== null && envVal !== "") {
    return envVal === "true" || envVal === "1"
  }

  if (!db) {
    return true
  }

  const settingsDoc = await getDoc(doc(db, "settings", "global"))
  if (!settingsDoc.exists()) {
    return true
  }

  const data = settingsDoc.data()
  return data?.signupEnabled !== false
}

export async function findCollaboratorRoleByEmail(
  db: Firestore | null,
  email: string,
): Promise<CollaboratorRole> {
  if (!db) {
    return null
  }

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return null
  }

  const judgesSnapshot = await getDocs(
    query(collection(db, "judges"), where("email", "==", normalizedEmail)),
  )
  if (!judgesSnapshot.empty) {
    return "judge"
  }

  // Fallback for legacy records with non-normalized email values.
  const allJudgesSnapshot = await getDocs(collection(db, "judges"))
  const judgeFound = allJudgesSnapshot.docs.some((docSnap) => {
    const rawEmail = String(docSnap.data()?.email || "")
    return normalizeEmail(rawEmail) === normalizedEmail
  })
  if (judgeFound) {
    return "judge"
  }

  const mentorsSnapshot = await getDocs(
    query(collection(db, "mentors"), where("email", "==", normalizedEmail)),
  )
  if (!mentorsSnapshot.empty) {
    return "mentor"
  }

  const allMentorsSnapshot = await getDocs(collection(db, "mentors"))
  const mentorFound = allMentorsSnapshot.docs.some((docSnap) => {
    const rawEmail = String(docSnap.data()?.email || "")
    return normalizeEmail(rawEmail) === normalizedEmail
  })
  if (mentorFound) {
    return "mentor"
  }

  return null
}