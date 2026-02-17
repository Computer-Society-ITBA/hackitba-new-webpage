"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { getAuthClient, getDbClient } from "@/lib/firebase/client-config"
import { useAuth } from "@/lib/firebase/auth-context"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { NeonGlow } from "@/components/effects/neon-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CodeBackground } from "@/components/effects/code-background"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { ArrowLeft, Home } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { doc, getDoc } from "firebase/firestore"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const { user, loading: authLoading } = useAuth()
  const db = getDbClient()

  useEffect(() => {
    if (!db) return
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setSignupEnabled(data?.signupEnabled !== false)
        } else {
          setSignupEnabled(true)
        }
      } catch (err) {
        console.error("Error loading signup setting:", err)
        setSignupEnabled(true)
      }
    }
    loadSettings()
  }, [db])

  

  // Redirect when user is loaded after login
  useEffect(() => {
    if (shouldRedirect && !authLoading && user) {
      const onboardingStep = user.onboardingStep || 0

      console.log("Login - User onboarding step:", onboardingStep, typeof onboardingStep)

      // Redirect based on onboarding completion
      if (Number(onboardingStep) < 2) {
        // Haven't completed event signup - only redirect if signup is enabled
        if (signupEnabled) {
          router.replace(`/${locale}/auth/event-signup`)
        } else {
          // Signup disabled, go to home
          router.replace(`/${locale}`)
        }
      } else {
        // Completed all onboarding, go to dashboard
        router.replace(`/${locale}/dashboard`)
      }
    }
  }, [shouldRedirect, authLoading, user, router, locale, signupEnabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const authClient = getAuthClient()
      if (!authClient) {
        setError(translations.auth.login.errors.firebaseNotConfigured)
        setLoading(false)
        return
      }

      await signInWithEmailAndPassword(authClient, email, password)
      console.log("Login successful, waiting for user data...")
      setShouldRedirect(true)
    } catch (error: any) {
      // Map Firebase auth errors to friendly, localized messages
      const code: string | undefined = error?.code || (typeof error?.message === 'string' ? (error.message.match(/auth\/[\w-]+/) || [])[0] : undefined)
      let msg = translations.auth.login.errors.loginFailed

      if (code && /invalid-credential|wrong-password|invalid-login-credentials|user-not-found/.test(code)) {
        msg = translations.auth.login.errors.invalidCredentials
      } else if (error?.message && typeof error.message === 'string') {
        msg = error.message
      }

      toast({
        title: translations.auth.login.errors.loginFailed || (locale === "es" ? "Error" : "Error"),
        description: msg,
        variant: "destructive",
      })
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <CodeBackground />

      <div className="absolute top-4 left-4 z-20 flex gap-2">
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

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-6">
          <p className="text-brand-cyan text-xs font-pixel mb-2 opacity-70">{translations.auth.login.endpoint}</p>
          <h1 className="font-pixel text-4xl md:text-5xl mb-2">
            <NeonGlow color="orange">{translations.auth.login.title}</NeonGlow>
          </h1>
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

            {/* Errors are shown via toast notifications */}

            <PixelButton type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? translations.auth.login.buttons.loggingIn : translations.auth.login.buttons.login}
            </PixelButton>

            <div className="text-center pt-4 border-t border-brand-cyan/20">
              <p className="text-brand-cyan text-sm">
                {translations.auth.login.footer.noAccount}{" "}
                <Link href={`/${locale}/auth/signup`} className="text-brand-yellow hover:neon-glow-orange">
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