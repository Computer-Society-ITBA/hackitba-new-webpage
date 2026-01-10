"use client"

import type React from "react"

import { useAuth } from "@/lib/firebase/auth-context"
import { PixelButton } from "@/components/ui/pixel-button"
import { useRouter } from "next/navigation"
import { NeonGlow } from "@/components/effects/neon-glow"
import Link from "next/link"
import { Home, User, Settings, LogOut } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 glass-effect border-r border-brand-cyan/20 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="font-pixel text-2xl text-brand-orange neon-glow-orange">
            <Link href="/">{"<HackITBA>"}</Link>
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
          >
            <Home size={20} />
            <span className="font-pixel text-sm">Dashboard</span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
          >
            <User size={20} />
            <span className="font-pixel text-sm">Profile</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
          >
            <Settings size={20} />
            <span className="font-pixel text-sm">Settings</span>
          </Link>
        </nav>

        <div className="border-t border-brand-cyan/20 pt-6">
          <div className="mb-4">
            <p className="text-brand-cyan text-sm">{user?.profile.name}</p>
            <p className="text-brand-cyan/60 text-xs font-mono">{user?.email}</p>
            <p className="text-brand-yellow text-xs font-pixel mt-1">{user?.role.toUpperCase()}</p>
          </div>

          <PixelButton onClick={handleSignOut} variant="outline" size="sm" className="w-full">
            <LogOut size={16} className="mr-2" />
            Sign Out
          </PixelButton>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="font-pixel text-4xl text-brand-orange">
            <NeonGlow color="orange">{title}</NeonGlow>
          </h2>
        </div>

        {children}
      </main>
    </div>
  )
}
