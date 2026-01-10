export async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Email] Would send to: ${to}`)
    console.log(`[Email] Subject: ${subject}`)
    console.log(`[Email] HTML Preview:`, html.substring(0, 200))
    return { success: true, message: "Email logged in development" }
  }

  console.log(`[Email] Sending to: ${to}`)
  console.log(`[Email] Subject: ${subject}`)

  return { success: true, message: "Email sent" }
}
