import { useState, useEffect } from "react"
import { collection, getDocs, query } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import type { Locale } from "@/lib/i18n/config"

export interface Category {
    id: string
    name: string
    description: string
    iconName: string
    // Keep raw data for flexibility if needed
    englishName: string
    spanishName: string
    englishDescription: string
    spanishDescription: string
}

interface UseCategoriesReturn {
    categories: Category[]
    loading: boolean
    error: string | null
}

export function useCategories(locale: Locale): UseCategoriesReturn {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const db = getDbClient()
                if (!db) throw new Error("Firestore not initialized")

                const q = query(collection(db, "categories"))
                const snapshot = await getDocs(q)

                const categoriesData: Category[] = snapshot.docs.map(doc => {
                    const d = doc.data()

                    return {
                        id: doc.id,
                        name: locale === "es" ? (d.spanishName || d.englishName) : (d.englishName || d.spanishName),
                        description: locale === "es" ? (d.spanishDescription || d.englishDescription) : (d.englishDescription || d.spanishDescription),
                        iconName: d.iconName || "Code",
                        englishName: d.englishName || "",
                        spanishName: d.spanishName || "",
                        englishDescription: d.englishDescription || "",
                        spanishDescription: d.spanishDescription || "",
                    } as Category
                })

                setCategories(categoriesData)
            } catch (err: any) {
                console.error("useCategories Error:", err)
                setError(err.message ?? "Failed to load categories")
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [locale])

    return { categories, loading, error }
}
