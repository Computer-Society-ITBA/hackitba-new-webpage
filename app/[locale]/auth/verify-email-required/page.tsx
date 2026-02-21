"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { NeonGlow } from "@/components/effects/neon-glow"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { AlertCircle, Mail, Home, ArrowLeft, RotateCw } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"

export default function VerifyEmailRequiredPage() {
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // If user already verified email, redirect to event signup
    if (!authLoading && user?.emailVerified) {
      console.log("Email already verified, redirecting to event signup")
      router.replace(`/${locale}/auth/event-signup`)
    }
  }, [user?.emailVerified, authLoading, router, locale])

  const handleResendEmail = async () => {
    if (!user?.email) {
      setError("No email found. Please try logging in again.")
      return
    }

    setResendLoading(true)
    setError("")
    setMessage("")

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://us-central1-webpage-36e40.cloudfunctions.net/api"

      // Create a new verification token
      const response = await fetch(`${apiUrl}/users/resend-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to resend verification email")
      }

      setMessage("Verification email sent! Please check your inbox.")
    } catch (err: any) {
      console.error("Resend error:", err)
      setError(err.message || "Failed to resend verification email. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  const handleResendWithNewEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError(translations.verifyEmail.errors.invalidEmail)
      return
    }

    setResendLoading(true)
    setError("")
    setMessage("")

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://us-central1-webpage-36e40.cloudfunctions.net/api"

      // Call change-email endpoint to update email and send verification
      const response = await fetch(`${apiUrl}/users/change-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldEmail: user.email, newEmail: newEmail })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to change email")
      }

      setMessage(translations.verifyEmail.messages.emailSent)
      setEditingEmail(false)
      setNewEmail("")
    } catch (err: any) {
      console.error("Change email error:", err)
      setError(err.message || translations.verifyEmail.errors.changeFailed)
    } finally {
      setResendLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-brand-cyan font-pixel">{translations.verifyEmailPage.loading}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-red-400 font-pixel text-center">
          <p className="mb-4">Not authenticated</p>
          <Link href={`/${locale}/auth/login`} className="text-brand-orange hover:text-brand-cyan">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">

      <div className="absolute top-8 left-8 z-20 flex gap-2">
        <button
          onClick={() => router.back()}
          className="p-2 text-brand-cyan hover:text-brand-orange hover:neon-glow-orange transition-colors"
          title="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <Link
          href={`/${locale}`}
          className="p-2 text-brand-cyan hover:text-brand-orange hover:neon-glow-orange transition-colors"
          title="Home"
        >
          <Home size={24} />
        </Link>
      </div>

      <GlassCard className="w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-brand-orange" />
            </div>
            <h1 className="text-3xl leading-tight font-bold font-pixel mb-2">
              {translations.verifyEmail.title}
            </h1>
          </div>

          {/* Message Box */}
          <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg p-4 mb-6">
            <p className="text-brand-cyan font-pixel text-sm mb-2">
              {translations.verifyEmail.sentTo}
            </p>
            {!editingEmail ? (
              <div className="flex flex-col gap-2">
                <p className="text-brand-orange font-pixel w-full">{user.email}</p>
                <button
                  onClick={() => setEditingEmail(true)}
                  className="text-xs text-brand-cyan hover:text-brand-orange underline text-left"
                >
                  {translations.verifyEmail.change}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={translations.verifyEmail.newEmailPlaceholder}
                  className="w-full px-3 py-2 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan placeholder-brand-cyan/50 rounded text-sm focus:outline-none focus:border-brand-orange"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleResendWithNewEmail}
                    disabled={resendLoading || !newEmail}
                    className="flex-1 px-3 py-2 bg-brand-orange text-black font-pixel text-xs rounded hover:bg-brand-orange/80 disabled:opacity-50"
                  >
                    {translations.verifyEmail.resend}
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmail(false)
                      setNewEmail("")
                    }}
                    className="flex-1 px-3 py-2 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan font-pixel text-xs rounded hover:bg-brand-cyan/20"
                  >
                    {translations.verifyEmail.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg p-4 mb-6">
            <div className="flex gap-3 mb-3">
              <div>
                <p className="text-brand-cyan font-pixel text-sm mb-2">
                  {translations.verifyEmail.nextSteps}
                </p>
                <ol className="text-brand-cyan/70 text-xs space-y-1">
                  <li>1. {translations.verifyEmail.step1}</li>
                  <li>2. {translations.verifyEmail.step2}</li>
                  <li>3. {translations.verifyEmail.step3}</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {message && (
            <div className="p-3 rounded bg-green-500/10 border border-green-500/30 mb-4">
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 mb-6">
            <PixelButton
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="leading-none w-full"
              variant="outline"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              {resendLoading
                ? translations.verifyEmail.sending
                : translations.verifyEmail.resendEmail}
            </PixelButton>

            <button
              onClick={() => {
                window.location.reload()
              }}
              className="leading-none w-full px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20 transition-colors rounded text-sm font-pixel"
            >
              {translations.verifyEmail.alreadyVerified}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-brand-cyan/20 pt-4">
            <p className="text-brand-cyan/70 text-xs mb-2">
              {translations.verifyEmail.didntReceive}
            </p>
            <p className="text-brand-cyan/70 text-xs">
              {locale === "es"
                ? "Revisa tu carpeta de spam o espera unos minutos"
                : "Check your spam folder or wait a few minutes"}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
