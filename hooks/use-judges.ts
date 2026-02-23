import { useState, useEffect } from "react"
import { collection, getDocs, query } from "firebase/firestore"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { getDownloadURL, ref } from "firebase/storage"

export interface Judge {
    id: string
    name: string
    position: string
    company: string
    bio: string

    // Optional socials
    linkedin?: string
    github?: string
    instagram?: string
    twitter?: string

    avatarPath?: string
    avatar?: string
}

interface UseJudgesReturn {
    judges: Judge[]
    loading: boolean
    error: string | null
}

export function useJudges(): UseJudgesReturn {
    const [judges, setJudges] = useState<Judge[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchJudges = async () => {
            try {
                const db = getDbClient("hackitba")
                const storage = getStorageClient("hackitba")
                if (!db) throw new Error("Firestore not initialized")

                const q = query(collection(db, "judges"))
                const snapshot = await getDocs(q)

                const judgesData = await Promise.all(
                    snapshot.docs.map(async (doc) => {
                        const d = doc.data()
                        let avatarUrl = d.avatarPath

                        if (d.avatarPath && !d.avatarPath.startsWith("http") && storage) {
                            try {
                                const avatarRef = ref(storage, d.avatarPath)
                                avatarUrl = await getDownloadURL(avatarRef)
                            } catch (err) {
                                console.error(`Failed to resolve avatar for ${d.name}:`, err)
                            }
                        }

                        return {
                            id: doc.id,
                            name: d.name,
                            position: d.position,
                            company: d.company,
                            bio: d.bio,
                            linkedin: d.linkedin,
                            github: d.github,
                            instagram: d.instagram,
                            twitter: d.twitter,
                            avatar: avatarUrl,
                        } as Judge
                    })
                )

                setJudges(judgesData)
            } catch (err: any) {
                setError(err.message ?? "Failed to load judges")
            } finally {
                setLoading(false)
            }
        }

        fetchJudges()
    }, [])

    return { judges, loading, error }
}