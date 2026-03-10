"use client"

import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { WinnersReveal } from "@/components/admin/winners-reveal"
import type { Locale } from "@/lib/i18n/config"

export default function WinnersPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const locale = (params.locale as Locale) || "es"

    // Check feature flag
    const showWinners = process.env.NEXT_PUBLIC_SHOW_WINNERS === "true"

    useEffect(() => {
        if (!loading && user) {
            // Admins always have access
            if (user.role === "admin") return

            // Participants only if flag is enabled
            if (user.role === "participant" && showWinners) return

            // Otherwise redirect
            router.replace(`/${locale}/dashboard`)
        }
    }, [user, loading, showWinners, router, locale])

    if (loading) return null

    return (
        <ProtectedRoute allowedRoles={["admin", "participant"]}>
            <main
                className="relative min-h-screen w-full overflow-hidden"
                style={{ background: "#020617" }}
            >
                <WinnersReveal />
            </main>
        </ProtectedRoute>
    )
}
