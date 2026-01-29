"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { getAuthClient, getDbClient } from "./client-config"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authClient = getAuthClient()
    const dbClient = getDbClient()

    if (!authClient || !dbClient) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(authClient, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(dbClient, "users", firebaseUser.uid))
          if (userDoc.exists()) {
            setUser({
              id: userDoc.id,
              ...userDoc.data(),
            } as User)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    const authClient = getAuthClient()
    if (!authClient) {
      return
    }

    await authClient.signOut()
    setUser(null)
    setFirebaseUser(null)
  }

  return <AuthContext.Provider value={{ user, firebaseUser, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
