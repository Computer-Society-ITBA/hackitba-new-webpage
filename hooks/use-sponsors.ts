import { useState, useEffect } from "react"
import { collection, getDocs, query } from "firebase/firestore"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { getDownloadURL, ref } from "firebase/storage"

export interface Sponsor {
    id: string
    name: string
    redirectUrl: string
    imagePath: string
    imageUrl?: string
}

interface UseSponsorsReturn {
    sponsors: Sponsor[]
    loading: boolean
    error: string | null
}

export function useSponsors(): UseSponsorsReturn {
    const [sponsors, setSponsors] = useState<Sponsor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                const db = getDbClient()
                const storage = getStorageClient()
                if (!db) throw new Error("Firestore not initialized")

                const q = query(collection(db, "sponsors"))
                const snapshot = await getDocs(q)

                const sponsorsData = await Promise.all(snapshot.docs.map(async (doc) => {
                    const d = doc.data()
                    const rawPath = d.imagePath
                    let imageUrl = ""

                    if (rawPath && typeof rawPath === 'string' && !rawPath.startsWith('http') && storage) {
                        try {
                            const cleanPath = rawPath.startsWith('/') ? rawPath.substring(1) : rawPath
                            const imageRef = ref(storage, cleanPath)
                            imageUrl = await getDownloadURL(imageRef)
                        } catch (err) {
                            console.error(`Failed to resolve storage path "${rawPath}" for sponsor ${d.name}:`, err)
                        }
                    } else if (rawPath && rawPath.startsWith('http')) {
                        imageUrl = rawPath
                    }

                    return {
                        id: doc.id,
                        name: d.name || "Unknown",
                        redirectUrl: d.redirectUrl || "#",
                        imagePath: rawPath || "",
                        imageUrl: imageUrl,
                    } as Sponsor
                }))

                setSponsors(sponsorsData)
            } catch (err: any) {
                console.error("useSponsors Error:", err)
                setError(err.message ?? "Failed to load sponsors")
            } finally {
                setLoading(false)
            }
        }

        fetchSponsors()
    }, [])

    return { sponsors, loading, error }
}
