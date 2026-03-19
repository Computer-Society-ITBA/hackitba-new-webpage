"use client"

import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MentorTeamsDashboard } from "@/components/dashboard/mentor-teams-dashboard"
import type { Locale } from "@/lib/i18n/config"

export default function MentorTeamsPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || "es"

  return (
    <ProtectedRoute allowedRoles={["mentor"]}>
      <DashboardLayout title={locale === "es" ? "Equipos" : "Teams"}>
        <MentorTeamsDashboard locale={locale} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
