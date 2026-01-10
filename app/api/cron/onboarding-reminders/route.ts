import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/config"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const usersSnapshot = await adminDb().collection("users").where("onboardingStep", "<", 3).get()

    const reminders = []

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id

      reminders.push({
        userId,
        email: userData.email,
        name: userData.profile?.name || "User",
        role: userData.role,
        onboardingStep: userData.onboardingStep,
      })

      console.log(`[Cron] Onboarding reminder sent to: ${userData.email}`)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${reminders.length} onboarding reminders`,
      reminders,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[Cron] Onboarding reminders error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
