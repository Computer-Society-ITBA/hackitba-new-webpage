"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { useRouter, useParams } from "next/navigation"
import { WinnersReveal } from "@/components/admin/winners-reveal"
import { doc, getDoc } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { Loading } from "@/components/ui/loading"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"

export default function WinnersPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const locale = (params.locale as Locale) || "es"
    const [showWinners, setShowWinners] = useState<boolean | null>(null)
    const [settingsLoading, setSettingsLoading] = useState(true)
    const t = getTranslations(locale)

    useEffect(() => {
        const db = getDbClient()
        if (!db) return

        const checkSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, "settings", "global"))
                if (settingsDoc.exists()) {
                    setShowWinners(!!settingsDoc.data()?.showWinners)
                } else {
                    setShowWinners(false)
                }
            } catch (err) {
                console.error("Error checking winners settings:", err)
                setShowWinners(false)
            } finally {
                setSettingsLoading(false)
            }
        }
        checkSettings()
    }, [])

    useEffect(() => {
        if (!authLoading && !settingsLoading && showWinners !== null) {
            // Admins always have access
            if (user?.role === "admin") return

            // If showWinners is disabled, redirect
            if (!showWinners) {
                // If logged in, go to dashboard, otherwise home
                router.replace(user ? `/${locale}/dashboard` : `/${locale}`)
            }
        }
    }, [user, authLoading, settingsLoading, showWinners, router, locale])

    if (authLoading || settingsLoading) return <Loading text={t.loading.synchronizing} />

    // If winners are not to be shown and user is not admin, we return null while redirecting
    if (!showWinners && user?.role !== "admin") return null

    return (
        <main
            className="relative min-h-screen w-full overflow-hidden"
            style={{ background: "#020617" }}
        >
            <WinnersReveal />
        </main>
    )
}
