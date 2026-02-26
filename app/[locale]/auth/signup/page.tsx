"use client"

import type React from "react"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { signInWithEmailAndPassword, getAuth } from "firebase/auth"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight } from "lucide-react"
import { AuthNavigation } from "@/components/auth/auth-navigation"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { NeonGlow } from "@/components/effects/neon-glow"
import { toast } from "@/hooks/use-toast"
import { Loading } from "@/components/ui/loading"
import { CodeBackground } from "@/components/effects/code-background"

function SignupContent() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const searchParams = useSearchParams()

  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "true" || process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "1"
  const [signupLoading, setSignupLoading] = useState(false)

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!signupEnabled) {
      router.replace(`/${locale}`)
    }
  }, [signupEnabled, router, locale])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    setError("")

    if (!signupEnabled) {
      const msg = translations.auth.signup.errors.signupDisabled
      setError(msg)
      toast({ title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"), description: msg, variant: "destructive" })
      return
    }

    // Validation
    if (!formData.name || !formData.surname || !formData.email || !formData.password || !formData.confirmPassword) {
      const msg = translations.auth.signup.errors.fillAllFields
      setError(msg)
      toast({ title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"), description: msg, variant: "destructive" })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      const msg = translations.auth.signup.errors.invalidEmail
      setError(msg)
      toast({ title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"), description: msg, variant: "destructive" })
      return
    }

    if (formData.password.length < 6) {
      const msg = translations.auth.signup.errors.passwordTooShort
      setError(msg)
      toast({ title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"), description: msg, variant: "destructive" })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      const msg = translations.auth.signup.errors.passwordMismatch
      setError(msg)
      toast({ title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"), description: msg, variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      // Prepare data for the backend endpoint
      const payload = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password,
      }
      console.log("Creating account...", payload)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      // TODO: Replace with actual API call
      const response = await fetch(`${apiUrl}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || translations.auth.signup.errors.createFailed)
      }

      const data = await response.json()
      console.log("Registration response:", data)

      // Save uid to localStorage for event signup
      if (typeof window !== 'undefined') {
        localStorage.setItem('userUid', data.uid)
        localStorage.setItem('userEmail', formData.email)
      }

      // Authenticate with Firebase to get an ID token
      const auth = getAuth()
      let isAuthenticatedWithFirebase = false
      try {
        console.log("Attempting Firebase sign-in...")
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
        const idToken = await userCredential.user.getIdToken()
        if (typeof window !== 'undefined') {
          localStorage.setItem('userToken', idToken)
        }
        console.log("User authenticated with Firebase")
        isAuthenticatedWithFirebase = true
      } catch (authError) {
        console.warn("Firebase auth error (non-critical, will try again on next page):", authError)
        // Continue anyway - we have the uid and can authenticate from event-signup page
      }

      // Wait a moment for Firebase to sync user data, then redirect
      console.log("Waiting for user sync before redirecting...")
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Success - redirect to verify email page
      console.log("Redirecting to verify email page...")
      router.push(`/${locale}/auth/verify-email-required`)
    } catch (err: any) {
      console.error("Registration error:", err)
      const msg = err?.message || translations.auth.signup.errors.createFailed
      setError(msg)
      toast({ title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"), description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (signupLoading || !signupEnabled) {
    return <Loading text={translations.auth.signup.loading} />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <CodeBackground />

      <AuthNavigation locale={locale} />

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-6">
          <p className="text-brand-cyan text-xs font-pixel mb-2 opacity-70">{translations.auth.signup.endpoint}</p>
          <h1 className="font-pixel text-4xl md:text-5xl mb-2">
            <NeonGlow color="orange">{translations.auth.signup.title || "Sign Up"}</NeonGlow>
          </h1>
        </div>

        <GlassCard neonOnHover neonColor="cyan" className="py-2">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 px-6 py-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-brand-cyan font-pixel text-xs">
                  {translations.auth.signup.fields.name} <span className="text-red-400">{translations.auth.signup.validation.required}</span>
                </Label>
                <Input id="name" value={formData.name} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="surname" className="text-brand-cyan font-pixel text-xs">
                  {translations.auth.signup.fields.surname} <span className="text-red-400">{translations.auth.signup.validation.required}</span>
                </Label>
                <Input id="surname" value={formData.surname} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-brand-cyan font-pixel text-xs">
                {translations.auth.signup.fields.email} <span className="text-red-400">{translations.auth.signup.validation.required}</span>
              </Label>
              <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" placeholder={translations.auth.signup.fields.emailPlaceholder} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-brand-cyan font-pixel text-xs">
                {translations.auth.signup.fields.password} <span className="text-red-400">{translations.auth.signup.validation.required}</span>
              </Label>
              <Input id="password" type="password" value={formData.password} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" placeholder={translations.auth.signup.fields.passwordPlaceholder} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-brand-cyan font-pixel text-xs">
                {translations.auth.signup.fields.confirmPassword} <span className="text-red-400">{translations.auth.signup.validation.required}</span>
              </Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" placeholder={translations.auth.signup.fields.passwordPlaceholder} />
            </div>
            {!signupLoading && !signupEnabled && (
              <div className="p-2 rounded bg-brand-orange/10 border border-brand-orange/30">
                <p className="text-brand-orange text-xs">
                  {translations.auth.signup.errors.signupDisabled}
                </p>
              </div>
            )}

            {/* Errors are shown with toast notifications */}

            <div className="p-2 rounded bg-brand-cyan/5 border border-brand-cyan/20">
              <p className="text-brand-cyan/70 text-[10px] leading-tight">
                {locale === "es"
                  ? "Al completar este formulario, aceptás compartir tus datos con los organizadores del evento y sponsors."
                  : "By completing this form, you agree to share your data with the event organizers and sponsors."}
              </p>
            </div>

            <PixelButton type="submit" disabled={loading || !signupEnabled} className="w-full" size="sm">
              {loading ? translations.auth.signup.buttons.creating : translations.auth.signup.buttons.create}
            </PixelButton>

            <div className="text-center pt-2 border-t border-brand-cyan/20">
              <p className="text-brand-cyan text-xs">
                {translations.auth.signup.footer.alreadyRegistered}{" "}
                <Link href={`/${locale}/auth/login`} className="text-brand-yellow hover:neon-glow-orange">
                  {translations.auth.signup.footer.login}
                </Link>
              </p>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)

  return (
    <Suspense fallback={<Loading text={translations.auth.signup.loading} />}>
      <SignupContent />
    </Suspense>
  )
}