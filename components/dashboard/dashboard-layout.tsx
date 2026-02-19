"use client"

import type React from "react"

import { useAuth } from "@/lib/firebase/auth-context"
import { PixelButton } from "@/components/ui/pixel-button"
import { useRouter, useParams } from "next/navigation"
import { NeonGlow } from "@/components/effects/neon-glow"
import Link from "next/link"
import { ArrowLeft, Home, User, LogOut, CheckSquare } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "es"

  const handleSignOut = async () => {
    await signOut()
    router.push(`/${locale}/auth/login`)
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 glass-effect border-r border-brand-cyan/20 p-6 flex flex-col sticky top-0 h-screen">
        <div className="mb-8">
          <h1 className="font-pixel text-2xl text-brand-yellow neon-glow-orange">
            <Link href={`/${locale}`}>{"<HackITBA>"}</Link>
          </h1>
        </div>

        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-4 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors w-full"
          >
            <ArrowLeft size={20} />
            <span className="font-pixel text-sm">Back</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-4 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
          >
            <Home size={20} />
            <span className="font-pixel text-sm">Dashboard</span>
          </Link>

          {user?.role === "admin" && (
            <Link
              href={`/${locale}/dashboard/admin/approvals`}
              className="flex items-center gap-4 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
            >
              <CheckSquare size={20} />
              <span className="font-pixel text-sm">Approvals</span>
            </Link>
          )}

        </nav>

        <div className="border-t border-brand-cyan/20 pt-2 mt-auto">
          <p className="px-4 pb-1 text-brand-yellow text-xs font-pixel">{user?.role.toUpperCase()}</p>
          <Link
            href={`/${locale}/dashboard/profile`}
            className="flex items-center gap-3 px-4 py-3 rounded hover:bg-brand-cyan/10 transition-colors mb-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-brand-cyan" />
            </div>
            <div className="min-w-0">
              <p className="text-brand-cyan text-sm truncate">{user?.name} {user?.surname}</p>
              <p className="text-brand-cyan/60 text-xs truncate">{user?.email}</p>
            </div>
          </Link>

          <PixelButton onClick={handleSignOut} variant="outline" size="sm" className="w-full">
            <LogOut size={16} className="mr-2" />
            Sign Out
          </PixelButton>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="font-pixel text-4xl text-brand-yellow">
            <NeonGlow color="orange">{title}</NeonGlow>
          </h2>
        </div>

        {children}
      </main>
    </div>
  )
}
