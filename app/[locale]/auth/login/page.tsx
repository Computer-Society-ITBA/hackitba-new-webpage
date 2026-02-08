"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { getAuthClient } from "@/lib/firebase/client-config"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { NeonGlow } from "@/components/effects/neon-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const authClient = getAuthClient()
      if (!authClient) {
        setError(translations.auth.login.errors.firebaseNotConfigured)
        return
      }

      await signInWithEmailAndPassword(authClient, email, password)
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || translations.auth.login.errors.loginFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 opacity-5 text-xs text-brand-cyan leading-relaxed overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i}>
            {Array.from({ length: 100 }, () => String.fromCharCode(33 + Math.floor(Math.random() * 94))).join("")}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-pixel text-4xl md:text-5xl mb-2">
            <NeonGlow color="orange">{translations.auth.login.title}</NeonGlow>
          </h1>
          <p className="text-brand-cyan text-sm">{translations.auth.login.endpoint}</p>
        </div>

        <GlassCard neonOnHover neonColor="cyan">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-cyan font-pixel">
                {translations.auth.login.fields.email}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                placeholder={translations.auth.login.fields.emailPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-brand-cyan font-pixel">
                {translations.auth.login.fields.password}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                placeholder={translations.auth.login.fields.passwordPlaceholder}
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <PixelButton type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? translations.auth.login.buttons.loggingIn : translations.auth.login.buttons.login}
            </PixelButton>

            <div className="text-center pt-4 border-t border-brand-cyan/20">
              <p className="text-brand-cyan text-sm">
                {translations.auth.login.footer.noAccount}{" "}
                <Link href={`/${locale}/auth/signup`} className="text-brand-orange hover:neon-glow-orange">
                  {translations.auth.login.footer.signUp}
                </Link>
              </p>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}