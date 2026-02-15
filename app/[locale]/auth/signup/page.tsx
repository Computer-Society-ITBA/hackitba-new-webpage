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
import { ChevronRight, ArrowLeft, Home } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { NeonGlow } from "@/components/effects/neon-glow"
import { getDbClient } from "@/lib/firebase/client-config"
import { doc, getDoc } from "firebase/firestore"

function SignupContent() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const searchParams = useSearchParams()
  const db = getDbClient()

  const [signupEnabled, setSignupEnabled] = useState(true)
  const [signupLoading, setSignupLoading] = useState(true)

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
      } finally {
        setSignupLoading(false)
      }
    }

    loadSettings()
  }, [db])

  useEffect(() => {
    if (!signupLoading && !signupEnabled) {
      router.replace(`/${locale}`)
    }
  }, [signupEnabled, signupLoading, router, locale])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    setError("")

    if (!signupEnabled) {
      setError(translations.auth.signup.errors.signupDisabled)
      return
    }

    // Validation
    if (!formData.name || !formData.surname || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(translations.auth.signup.errors.fillAllFields)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError(translations.auth.signup.errors.invalidEmail)
      return
    }

    if (formData.password.length < 6) {
      setError(translations.auth.signup.errors.passwordTooShort)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(translations.auth.signup.errors.passwordMismatch)
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
      setError(err.message || translations.auth.signup.errors.createFailed)
    } finally {
      setLoading(false)
    }
  }

  if (signupLoading || !signupEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-pixel text-2xl text-brand-cyan neon-glow-cyan">{translations.auth.signup.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="font-pixel absolute inset-0 opacity-5 text-xs text-brand-cyan leading-relaxed overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i}>
            {Array.from({ length: 100 }, () => String.fromCharCode(33 + Math.floor(Math.random() * 94))).join("")}
          </div>
        ))}
      </div>

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
                  {translations.auth.signup.fields.name}
                </Label>
                <Input id="name" value={formData.name} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="surname" className="text-brand-cyan font-pixel text-xs">
                  {translations.auth.signup.fields.surname}
                </Label>
                <Input id="surname" value={formData.surname} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-brand-cyan font-pixel text-xs">
                {translations.auth.signup.fields.email}
              </Label>
              <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" placeholder={translations.auth.signup.fields.emailPlaceholder} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-brand-cyan font-pixel text-xs">
                {translations.auth.signup.fields.password}
              </Label>
              <Input id="password" type="password" value={formData.password} onChange={handleInputChange} className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan h-9" placeholder={translations.auth.signup.fields.passwordPlaceholder} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-brand-cyan font-pixel text-xs">
                {translations.auth.signup.fields.confirmPassword}
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

            {error && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

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
                <Link href={`/${locale}/auth/login`} className="text-brand-orange hover:neon-glow-orange">
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-brand-cyan font-pixel text-xs uppercase animate-pulse">{translations.auth.signup.loading}</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}