"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"

function SignupContent() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const searchParams = useSearchParams()

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    setError("")

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

      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // })

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Success - redirect to event signup
      router.push(`/${locale}/auth/event-signup`)
    } catch (err: any) {
      setError(err.message || translations.auth.signup.errors.createFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 flex flex-col gap-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-pixel text-4xl">{translations.auth.signup.endpoint}</h1>
          </div>
          <p className="text-brand-cyan/60 text-xs font-pixel uppercase tracking-wider">{translations.auth.signup.title}</p>
        </div>

        {/* Main Card */}
        <GlassCard neonOnHover neonColor="cyan" className="p-8">
          <div className="min-h-[400px] flex flex-col">
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <h2 className="text-brand-orange font-pixel text-lg uppercase tracking-wider">{translations.auth.signup.sectionTitle}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-brand-cyan font-pixel text-xs">{translations.auth.signup.fields.name} <span className="text-red-500">{translations.auth.signup.validation.required}</span></Label>
                  <Input id="name" value={formData.name} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname" className="text-brand-cyan font-pixel text-xs">{translations.auth.signup.fields.surname} <span className="text-red-500">{translations.auth.signup.validation.required}</span></Label>
                  <Input id="surname" value={formData.surname} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-brand-cyan font-pixel text-xs">{translations.auth.signup.fields.email} <span className="text-red-500">{translations.auth.signup.validation.required}</span></Label>
                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" placeholder={translations.auth.signup.fields.emailPlaceholder} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-brand-cyan font-pixel text-xs">{translations.auth.signup.fields.password} <span className="text-red-500">{translations.auth.signup.validation.required}</span></Label>
                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" placeholder={translations.auth.signup.fields.passwordPlaceholder} />
                <p className="text-[12px] text-brand-cyan/40 uppercase">{translations.auth.signup.validation.minCharacters}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-brand-cyan font-pixel text-xs">{translations.auth.signup.fields.confirmPassword} <span className="text-red-500">{translations.auth.signup.validation.required}</span></Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" placeholder={translations.auth.signup.fields.passwordPlaceholder} />
              </div>
            </div>

            {error && (
              <div className="mt-4 px-8 p-2 rounded bg-red-500/10 border border-red-500/30 animate-in zoom-in-95 duration-200">
                <p className="text-[10px] text-red-400 font-pixel">{error}</p>
              </div>
            )}

            <div className="mt-auto pt-8">
              <PixelButton
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex flex-row justify-between items-center"
              >
                {loading ? (
                  translations.auth.signup.buttons.creating
                ) : (
                  <>{translations.auth.signup.buttons.create} <ChevronRight className="w-6 h-6 ml-2" /></>
                )}
              </PixelButton>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-[10px] font-pixel text-brand-cyan/40 uppercase">
          {translations.auth.signup.footer.alreadyRegistered} <Link href={`/${locale}/auth/login`} className="text-brand-orange hover:neon-glow-orange transition-all ml-2 underline decoration-brand-orange/30">{translations.auth.signup.footer.login}</Link>
        </p>
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