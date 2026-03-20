"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PixelButton } from "@/components/ui/pixel-button"
import { AuthNavigation } from "@/components/auth/auth-navigation"
import { CodeBackground } from "@/components/effects/code-background"
import { NeonGlow } from "@/components/effects/neon-glow"
import { Loading } from "@/components/ui/loading"
import { toast } from "@/hooks/use-toast"
import { getDbClient } from "@/lib/firebase/client-config"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import {
  findCollaboratorRoleByEmail,
  loadSignupEnabled,
  normalizeEmail,
} from "@/lib/auth/signup-access"

interface SignupFormProps {
  collaboratorRoute: boolean
}

export function SignupForm({ collaboratorRoute }: SignupFormProps) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const db = getDbClient()

  const [signupEnabled, setSignupEnabled] = useState(true)
  const [signupLoading, setSignupLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const signupBlocked = useMemo(
    () => !signupEnabled && !collaboratorRoute,
    [signupEnabled, collaboratorRoute],
  )

  useEffect(() => {
    const load = async () => {
      try {
        const enabled = await loadSignupEnabled(db)
        setSignupEnabled(enabled)
      } catch (err) {
        console.error("Error loading signup setting:", err)
        setSignupEnabled(true)
      } finally {
        setSignupLoading(false)
      }
    }

    load()
  }, [db])

  useEffect(() => {
    if (!signupLoading && signupBlocked) {
      router.replace(`/${locale}`)
    }
  }, [signupLoading, signupBlocked, router, locale])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    setError("")

    if (signupBlocked) {
      const msg = translations.auth.signup.errors.signupDisabled
      setError(msg)
      toast({
        title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"),
        description: msg,
        variant: "destructive",
      })
      return
    }

    const requiresPersonalNames = !collaboratorRoute
    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      (requiresPersonalNames && (!formData.name || !formData.surname))
    ) {
      const msg = translations.auth.signup.errors.fillAllFields
      setError(msg)
      toast({
        title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"),
        description: msg,
        variant: "destructive",
      })
      return
    }

    const normalizedEmail = normalizeEmail(formData.email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      const msg = translations.auth.signup.errors.invalidEmail
      setError(msg)
      toast({
        title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"),
        description: msg,
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      const msg = translations.auth.signup.errors.passwordTooShort
      setError(msg)
      toast({
        title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"),
        description: msg,
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      const msg = translations.auth.signup.errors.passwordMismatch
      setError(msg)
      toast({
        title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"),
        description: msg,
        variant: "destructive",
      })
      return
    }

    if (collaboratorRoute) {
      try {
        const collaboratorRole = await findCollaboratorRoleByEmail(db, normalizedEmail)
        if (!collaboratorRole) {
          const msg =
            locale === "es"
              ? "Esta ruta es solo para mentores o jurados invitados."
              : "This route is only for invited mentors or judges."
          setError(msg)
          toast({ title: locale === "es" ? "Acceso restringido" : "Restricted access", description: msg, variant: "destructive" })
          return
        }
      } catch (err) {
        console.error("Error validating collaborator email:", err)
        const msg = locale === "es" ? "No se pudo validar el email" : "Could not validate email"
        setError(msg)
        toast({ title: locale === "es" ? "Error" : "Error", description: msg, variant: "destructive" })
        return
      }
    }

    setLoading(true)

    try {
      const payload = {
        name: collaboratorRoute ? undefined : formData.name,
        surname: collaboratorRoute ? undefined : formData.surname,
        email: normalizedEmail,
        password: formData.password,
        collaboratorRoute,
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const response = await fetch(`${apiUrl}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || translations.auth.signup.errors.createFailed)
      }

      const data = await response.json()

      if (typeof window !== "undefined") {
        localStorage.setItem("userUid", data.uid)
        localStorage.setItem("userEmail", normalizedEmail)
      }

      const auth = getAuth()
      try {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, formData.password)
        const idToken = await userCredential.user.getIdToken()
        if (typeof window !== "undefined") {
          localStorage.setItem("userToken", idToken)
        }
      } catch (authError) {
        console.warn("Firebase auth error (non-critical):", authError)
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push(`/${locale}/auth/verify-email-required`)
    } catch (err: any) {
      const msg = err?.message || translations.auth.signup.errors.createFailed
      setError(msg)
      toast({
        title: translations.auth.signup.title || (locale === "es" ? "Error" : "Error"),
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (signupLoading || signupBlocked) {
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
          {collaboratorRoute && !signupEnabled && (
            <p className="text-xs text-brand-yellow font-pixel mt-2">
              {locale === "es"
                ? "Ruta especial para mentores/jurados con email habilitado"
                : "Special route for mentors/judges with approved email"}
            </p>
          )}
        </div>

        <GlassCard neonOnHover neonColor="cyan" className="py-2">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="space-y-4 px-6 py-4"
          >
            {!collaboratorRoute && (
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
            )}

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

            {error && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            <div className="p-2 rounded bg-brand-cyan/5 border border-brand-cyan/20">
              <p className="text-brand-cyan/70 text-[10px] leading-tight">
                {locale === "es"
                  ? "Al completar este formulario, aceptas compartir tus datos con los organizadores del evento y sponsors."
                  : "By completing this form, you agree to share your data with the event organizers and sponsors."}
              </p>
            </div>

            <PixelButton type="submit" disabled={loading} className="w-full" size="sm">
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