import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/config"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventsSnapshot = await adminDb()
      .collection("events")
      .where("status", "==", "active")
      .where("endDate", "<=", new Date())
      .get()

    const closedEvents = []

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data()
      const eventId = eventDoc.id

      await adminDb().collection("events").doc(eventId).update({
        status: "completed",
        updatedAt: new Date(),
      })

      closedEvents.push({
        eventId,
        title: eventData.title,
        endDate: eventData.endDate,
      })

      console.log(`[Cron] Event closed: ${eventData.title}`)
    }

    const participantesSnapshot = await adminDb().collection("users").where("role", "==", "participante").get()

    const projectsSnapshot = await adminDb().collection("projects").get()
    const projectsByTeam = new Map()
    projectsSnapshot.docs.forEach((doc) => {
      projectsByTeam.set(doc.data().teamId, { id: doc.id, ...doc.data() })
    })

    const notifications = []

    for (const userDoc of participantesSnapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id

      const hasProject = projectsByTeam.has(userId)

      if (!hasProject && closedEvents.length > 0) {
        notifications.push({
          userId,
          email: userData.email,
          name: userData.profile?.name || "User",
          message: "Submission deadline has passed",
        })

        console.log(`[Cron] Deadline notification sent to: ${userData.email}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Closed ${closedEvents.length} events and sent ${notifications.length} notifications`,
      closedEvents,
      notifications,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[Cron] Submission deadline error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
