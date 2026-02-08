import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { Montserrat } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./tokens.css"
import "./globals.css"

const pixelFont = localFont({
  src: [
    {
      path: "./fonts/PixelarRegular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-pixel",
  display: "swap",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
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
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${pixelFont.variable} ${montserrat.variable}`}>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
