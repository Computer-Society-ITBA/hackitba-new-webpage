import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/firebase/auth-context"
import "../tokens.css"
import "../globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "HackITBA 2026 | Computer Society ITBA",
  description: "36 hours of non-stop intense development. Networking and mentoring from minute one.",
  keywords: ["hackathon", "ITBA", "programming", "coding", "competition", "Buenos Aires"],
  authors: [{ name: "Computer Society ITBA" }],
  openGraph: {
    title: "HackITBA 2026",
    description: "36 hours of non-stop intense development. Networking and mentoring from minute one.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
