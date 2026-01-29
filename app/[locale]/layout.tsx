import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/lib/firebase/auth-context"
import { locales } from "@/lib/i18n/config"

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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
