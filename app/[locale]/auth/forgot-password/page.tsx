"use client"

import type React from "react"
import { useState } from "react"
import { useParams } from "next/navigation"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { NeonGlow } from "@/components/effects/neon-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CodeBackground } from "@/components/effects/code-background"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { AuthNavigation } from "@/components/auth/auth-navigation"
import { toast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const t = translations.auth.forgotPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: t.errors.invalidEmail,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://us-central1-webpage-36e40.cloudfunctions.net/api"

      await fetch(`${apiUrl}/users/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      // Always show success — never reveal whether the email exists
      setSent(true)
    } catch {
      toast({
        title: t.errors.sendFailed,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <CodeBackground />
      <AuthNavigation locale={locale} />

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-6">
          <p className="text-brand-cyan text-xs font-pixel mb-2 opacity-70">{t.endpoint}</p>
          <h1 className="font-pixel text-4xl md:text-5xl mb-2">
            <NeonGlow color="orange">{t.title}</NeonGlow>
          </h1>
          {!sent && <p className="text-brand-cyan/70 text-sm mt-2">{t.subtitle}</p>}
        </div>

        <GlassCard neonOnHover neonColor="cyan">
          {sent ? (
            <div className="flex flex-col items-center py-8 text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <h2 className="font-pixel text-xl text-brand-yellow">
                <NeonGlow color="orange">{t.success.title}</NeonGlow>
              </h2>
              <p className="text-brand-cyan/80 text-sm leading-relaxed">
                {t.success.message}
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className="text-brand-cyan text-sm hover:text-brand-yellow transition-colors pt-2"
              >
                ← {t.footer.backToLogin}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-brand-cyan font-pixel">
                  {t.fields.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                  placeholder={t.fields.emailPlaceholder}
                />
              </div>

              <PixelButton type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? t.buttons.sending : t.buttons.send}
              </PixelButton>

              <div className="text-center pt-4 border-t border-brand-cyan/20">
                <Link
                  href={`/${locale}/auth/login`}
                  className="text-brand-cyan text-sm hover:text-brand-yellow transition-colors"
                >
                  ← {t.footer.backToLogin}
                </Link>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
