"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
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
import { CheckCircle, AlertCircle } from "lucide-react"

export function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const t = translations.auth.resetPassword

  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setTokenError(t.errors.tokenMissing)
    }
  }, [token, t.errors.tokenMissing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast({ title: t.errors.passwordTooShort, variant: "destructive" })
      return
    }

    if (password !== confirmPassword) {
      toast({ title: t.errors.passwordMismatch, variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://us-central1-webpage-36e40.cloudfunctions.net/api"

      const response = await fetch(`${apiUrl}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        const msg =
          response.status === 410
            ? t.errors.tokenExpired
            : data.error || t.errors.resetFailed

        toast({ title: msg, variant: "destructive" })
      }
    } catch {
      toast({ title: t.errors.resetFailed, variant: "destructive" })
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
          {!success && !tokenError && (
            <p className="text-brand-cyan/70 text-sm mt-2">{t.subtitle}</p>
          )}
        </div>

        <GlassCard neonOnHover neonColor="cyan">
          {tokenError ? (
            <div className="flex flex-col items-center py-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-red-400 text-sm">{tokenError}</p>
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="text-brand-cyan text-sm hover:text-brand-yellow transition-colors"
              >
                ← {locale === "es" ? "Solicitar nuevo link" : "Request new link"}
              </Link>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center py-8 text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <h2 className="font-pixel text-xl text-brand-yellow">
                <NeonGlow color="orange">{t.success.title}</NeonGlow>
              </h2>
              <p className="text-brand-cyan/80 text-sm leading-relaxed">
                {t.success.message}
              </p>
              <PixelButton
                onClick={() => router.push(`/${locale}/auth/login`)}
                className="mt-4"
                size="md"
              >
                {t.success.goToLogin}
              </PixelButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-brand-cyan font-pixel">
                  {t.fields.password}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                  placeholder={t.fields.passwordPlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-brand-cyan font-pixel">
                  {t.fields.confirmPassword}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                  placeholder={t.fields.passwordPlaceholder}
                />
              </div>

              <PixelButton type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? t.buttons.resetting : t.buttons.reset}
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
