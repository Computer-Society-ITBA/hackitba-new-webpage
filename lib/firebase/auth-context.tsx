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
  refreshUser: () => Promise<void>
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
          console.log("Firebase user authenticated:", firebaseUser.uid)
          const userDoc = await getDoc(doc(dbClient, "users", firebaseUser.uid))
          if (userDoc.exists()) {
            const rawData = userDoc.data()
            console.log("Raw Firestore data:", rawData)
            console.log("onboardingStep from Firestore:", rawData?.onboardingStep, typeof rawData?.onboardingStep)
            
            // Determine onboardingStep based on existing data
            let onboardingStep = rawData?.onboardingStep ?? 0
            
            // If undefined, check if they have event-signup data completed
            if (onboardingStep === 0) {
              if (rawData?.role === "participant") {
                // Check if participant has completed event-signup fields
                if (rawData?.dni && rawData?.university && rawData?.career) {
                  onboardingStep = 2 // Already completed event-signup
                }
              } else if (rawData?.role === "judge" || rawData?.role === "mentor") {
                // Check if judge/mentor has completed event-signup fields
                if (rawData?.dni && rawData?.company) {
                  onboardingStep = 2 // Already completed event-signup
                }
              } else {
                // Admin or other roles don't need event-signup
                onboardingStep = 2
              }
            }
            
            const userData = {
              id: userDoc.id,
              ...rawData,
              onboardingStep: onboardingStep,
            } as User
            console.log("User data after spread:", userData)
            console.log("onboardingStep after spread:", userData.onboardingStep, typeof userData.onboardingStep)
            setUser(userData)
          } else {
            console.warn("User document not found in Firestore for UID:", firebaseUser.uid)
            setUser(null)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser(null)
        }
      } else {
        console.log("No Firebase user authenticated")
        setUser(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const refreshUser = async () => {
    const authClient = getAuthClient()
    const dbClient = getDbClient()

    if (!authClient || !dbClient || !firebaseUser) {
      return
    }

    try {
      console.log("Refreshing user data from Firestore...")
      const userDoc = await getDoc(doc(dbClient, "users", firebaseUser.uid))
      if (userDoc.exists()) {
        const rawData = userDoc.data()
        console.log("Refreshed user data:", rawData)
        
        // Determine onboardingStep based on existing data
        let onboardingStep = rawData?.onboardingStep ?? 0
        
        // If undefined, check if they have event-signup data completed
        if (onboardingStep === 0) {
          if (rawData?.role === "participant") {
            // Check if participant has completed event-signup fields
            if (rawData?.dni && rawData?.university && rawData?.career) {
              onboardingStep = 2 // Already completed event-signup
            }
          } else if (rawData?.role === "judge" || rawData?.role === "mentor") {
            // Check if judge/mentor has completed event-signup fields
            if (rawData?.dni && rawData?.company) {
              onboardingStep = 2 // Already completed event-signup
            }
          } else {
            // Admin or other roles don't need event-signup
            onboardingStep = 2
          }
        }
        
        const userData = {
          id: userDoc.id,
          ...rawData,
          onboardingStep: onboardingStep,
        } as User
        setUser(userData)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  const signOut = async () => {
    const authClient = getAuthClient()
    if (!authClient) {
      return
    }

    await authClient.signOut()
    setUser(null)
    setFirebaseUser(null)
  }

  return <AuthContext.Provider value={{ user, firebaseUser, loading, signOut, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
