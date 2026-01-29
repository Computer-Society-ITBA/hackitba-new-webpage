"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { getAuthClient, getDbClient } from "@/lib/firebase/client-config"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { NeonGlow } from "@/components/effects/neon-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserRole } from "@/lib/firebase/types"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("participante")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const roleParam = searchParams.get("role") as UserRole
    if (roleParam && ["admin", "jurado", "participante"].includes(roleParam)) {
      setRole(roleParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const authClient = getAuthClient()
      const dbClient = getDbClient()

      if (!authClient || !dbClient) {
        setError("Firebase is not configured")
        return
      }

      const userCredential = await createUserWithEmailAndPassword(authClient, email, password)

      await setDoc(doc(dbClient, "users", userCredential.user.uid), {
        email,
        role,
        onboardingStep: 0,
        profile: {
          name,
          bio: "",
          avatar: "",
          company: "",
          linkedin: "",
          github: "",
          twitter: "",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
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
            <NeonGlow color="orange">Sign Up</NeonGlow>
          </h1>
          <p className="text-brand-cyan text-sm">POST /auth/signup</p>
        </div>

        <GlassCard neonOnHover neonColor="cyan">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-brand-cyan font-pixel">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-cyan font-pixel">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-brand-cyan font-pixel">
                Role
              </Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-navy border-brand-cyan/30">
                  <SelectItem value="participante">Participante</SelectItem>
                  <SelectItem value="jurado">Jurado</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-brand-cyan font-pixel">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-brand-cyan font-pixel">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan focus:border-brand-cyan"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <PixelButton type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creating account..." : "Sign Up"}
            </PixelButton>

            <div className="text-center pt-4 border-t border-brand-cyan/20">
              <p className="text-brand-cyan text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-brand-orange hover:neon-glow-orange">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
