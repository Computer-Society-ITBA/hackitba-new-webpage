import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { getDownloadURL, ref } from "firebase/storage"

export type MentorCategory = "entrepreneurship" | "tech" | "oratory"

export interface Mentor {
    id: string
    name: string
    position: string
    company: string
    categories?: MentorCategory[] // New: array of categories
    category?: MentorCategory // Deprecated: kept for backward compatibility
    englishBio: string
    spanishBio: string

    // Optional socials
    linkedin?: string
    github?: string
    instagram?: string
    twitter?: string

    avatarPath?: string
    avatar?: string
}

interface UseMentorsReturn {
    mentors: Mentor[]
    loading: boolean
    error: string | null
}

export function useMentors(): UseMentorsReturn {
    const [mentors, setMentors] = useState<Mentor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const db = getDbClient("hackitba")
                const storage = getStorageClient("hackitba")
                if (!db) throw new Error("Firestore not initialized")

                const q = query(collection(db, "mentors"))
                const snapshot = await getDocs(q)

                const mentorsData = await Promise.all(snapshot.docs.map(async (doc) => {
                    const d = doc.data()
                    let avatarUrl = d.avatarPath // Default to what's in Firestore

                    // If avatar looks like a storage path (e.g. "avatars/mentor.jpg") 
                    // and we have a storage client, resolve it.
                    if (d.avatarPath && !d.avatarPath.startsWith('http') && storage) {
                        try {
                            const avatarRef = ref(storage, d.avatarPath)
                            avatarUrl = await getDownloadURL(avatarRef)
                        } catch (err) {
                            console.error(`Failed to resolve avatar for ${d.name}:`, err)
                            // Keep original or set to undefined if broken
                        }
                    }

                    // Support both new (categories array) and old (category string) formats
                    const categories = d.categories && Array.isArray(d.categories) ? d.categories : (d.category ? [d.category] : [])

                    return {
                        id: doc.id,
                        name: d.name,
                        position: d.position,
                        company: d.company,
                        categories: categories,
                        category: categories[0], // Keep for backward compatibility
                        englishBio: d.englishBio ?? d.bio ?? "",
                        spanishBio: d.spanishBio ?? d.bio ?? "",
                        linkedin: d.linkedin,
                        github: d.github,
                        instagram: d.instagram,
                        twitter: d.twitter,
                        avatar: avatarUrl,
                    } as Mentor
                }))

                setMentors(mentorsData)
            } catch (err: any) {
                setError(err.message ?? "Failed to load mentors")
            } finally {
                setLoading(false)
            }
        }

        fetchMentors()
    }, [])

    return { mentors, loading, error }
}
