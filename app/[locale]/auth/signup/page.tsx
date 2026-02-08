"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight } from "lucide-react"

function SignupContent() {
  const router = useRouter()
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
      setError("Please fill all fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
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
      router.push(`/${searchParams.get("locale") || 'es'}/auth/event-signup`)
    } catch (err: any) {
      setError(err.message || "Failed to create account")
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
            <h1 className="font-pixel text-4xl">POST /api/auth/signup</h1>
          </div>
          <p className="text-brand-cyan/60 text-xs font-pixel uppercase tracking-wider">Create Your Account</p>
        </div>

        {/* Main Card */}
        <GlassCard neonOnHover neonColor="cyan" className="p-8">
          <div className="min-h-[400px] flex flex-col">
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <h2 className="text-brand-orange font-pixel text-lg uppercase tracking-wider">Account Setup</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-brand-cyan font-pixel text-xs">Nombre <span className="text-red-500">*</span></Label>
                  <Input id="name" value={formData.name} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname" className="text-brand-cyan font-pixel text-xs">Apellido <span className="text-red-500">*</span></Label>
                  <Input id="surname" value={formData.surname} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-brand-cyan font-pixel text-xs">Email <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" placeholder="tuemail@gmail.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-brand-cyan font-pixel text-xs">Password <span className="text-red-500">*</span></Label>
                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" placeholder="••••••••" />
                <p className="text-[12px] text-brand-cyan/40 uppercase">Min 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-brand-cyan font-pixel text-xs">Confirm Password <span className="text-red-500">*</span></Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" placeholder="••••••••" />
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
                  "CREATING ACCOUNT..."
                ) : (
                  <>CREATE ACCOUNT <ChevronRight className="w-6 h-6 ml-2" /></>
                )}
              </PixelButton>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-[10px] font-pixel text-brand-cyan/40 uppercase">
          Already registered? <Link href={`/${searchParams.get("locale") || 'es'}/auth/login`} className="text-brand-orange hover:neon-glow-orange transition-all ml-2 underline decoration-brand-orange/30">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-brand-cyan font-pixel text-xs uppercase animate-pulse">Establishing Team Protocol...</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}