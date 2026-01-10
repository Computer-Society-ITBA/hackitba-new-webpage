import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Cron job system is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
}
