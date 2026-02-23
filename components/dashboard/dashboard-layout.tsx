"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"

import { useAuth } from "@/lib/firebase/auth-context"
import { PixelButton } from "@/components/ui/pixel-button"
import { useRouter, useParams, usePathname } from "next/navigation"
import { NeonGlow } from "@/components/effects/neon-glow"
import Link from "next/link"
import { Home, User, LogOut, CheckSquare, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const locale = (params.locale as Locale) || "es"
  const dashboardHomeRoutes = [
    `/${locale}/dashboard`,
    `/${locale}/dashboard/participante`,
    `/${locale}/dashboard/admin`,
    `/${locale}/dashboard/jurado`,
  ]
  const isDashboardHome = dashboardHomeRoutes.includes(pathname)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [params])

  const handleSignOut = async () => {
    await signOut()
    router.push(`/${locale}/auth/login`)
  }

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [])
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), [])

  const sidebarContent = (
    <>
      <div className={`mb-8 flex items-center ${collapsed && !isMobile ? "justify-center" : "justify-between"} ${isMobile ? "gap-2" : "gap-4"}`}>
        <h1 className={`font-pixel text-brand-yellow neon-glow-orange ${collapsed && !isMobile ? "text-lg" : isMobile ? "text-xs" : "text-2xl"}`}>
          <Link href={`/${locale}`}>{collapsed && !isMobile ? "<H>" : "<HackITBA>"}</Link>
        </h1>
        {isMobile && (
          <button onClick={toggleMobile} className="text-brand-cyan hover:text-brand-yellow transition-colors p-1">
            <X size={20} />
          </button>
        )}
      </div>

      <div>
        <button
          onClick={() => { router.back(); if (isMobile) setMobileOpen(false) }}
          className={`flex items-center gap-2 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors w-full ${collapsed && !isMobile ? "justify-center" : ""}`}
          title="Back"
        >
          <div className="relative -translate-x-2 w-8 h-8 rotate-90 filter">
            <Image
              src="/images/flecha-abajo.png"
              alt="Arrow"
              fill
              className="object-contain"
            />
          </div>
          {(!collapsed || isMobile) && <span className="font-pixel text-sm">Back</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {isDashboardHome ? (
          <span
            className={`flex items-center gap-4 px-4 py-3 rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
            title="Dashboard"
          >
            <Home size={20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="font-pixel text-sm">Dashboard</span>}
          </span>
        ) : (
          <Link
            href={`/${locale}/dashboard`}
            onClick={() => isMobile && setMobileOpen(false)}
            className={`flex items-center gap-4 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
            title="Dashboard"
          >
            <Home size={20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="font-pixel text-sm">Dashboard</span>}
          </Link>
        )}

        {user?.role === "admin" && (
          <Link
            href={`/${locale}/dashboard/admin/approvals`}
            onClick={() => isMobile && setMobileOpen(false)}
            className={`flex items-center gap-4 px-4 py-3 rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
            title="Approvals"
          >
            <CheckSquare size={20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="font-pixel text-sm">Approvals</span>}
          </Link>
        )}
      </nav>

      <div className="border-t border-brand-cyan/20 pt-2 mt-auto">
        {(!collapsed || isMobile) && (
          <p className="px-2 pb-1 text-brand-yellow text-xs font-pixel">{user?.role.toUpperCase()}</p>
        )}
        <Link
          href={`/${locale}/dashboard/profile`}
          onClick={() => isMobile && setMobileOpen(false)}
          className={`flex items-center gap-3 px-2 py-3 rounded hover:bg-brand-cyan/10 transition-colors mb-2 group ${collapsed && !isMobile ? "justify-center" : ""}`}
          title="Profile"
        >
          <div className="w-8 h-8 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-brand-cyan" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="text-brand-cyan text-sm truncate">{user?.name} {user?.surname}</p>
              <p className="text-brand-cyan/60 text-xs truncate">{user?.email}</p>
            </div>
          )}
        </Link>

        {collapsed && !isMobile ? (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center py-3 text-brand-cyan hover:bg-brand-cyan/10 rounded transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        ) : (
          <PixelButton onClick={handleSignOut} variant="outline" size="sm" className="w-full">
            <LogOut size={16} className="mr-2" />
            Sign Out
          </PixelButton>
        )}
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside
          className={`glass-effect border-r border-brand-cyan/20 p-6 flex flex-col fixed top-0 left-0 h-screen overflow-visible transition-all duration-300 z-30 ${collapsed ? "w-20" : "w-64"
            }`}
        >
          {sidebarContent}

          {/* Collapse toggle button */}
          <button
            onClick={toggleCollapsed}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-brand-navy border border-brand-cyan/40 flex items-center justify-center text-brand-cyan hover:bg-brand-cyan/20 transition-colors z-10"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>
      )}

      {/* Sidebar - Mobile (drawer) */}
      {isMobile && (
        <aside
          className={`fixed top-0 left-0 h-full w-64 glass-effect border-r border-brand-cyan/20 p-6 flex flex-col z-50 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          style={{ backgroundColor: "rgba(10, 25, 47, 0.97)" }}
        >
          {sidebarContent}
        </aside>
      )}

      <main className={`flex-1 min-w-0 p-2 sm:p-4 md:p-8 transition-all duration-300 ${!isMobile ? (collapsed ? "ml-20" : "ml-64") : ""}`}>
        {/* Mobile header with hamburger */}
        {isMobile && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={toggleMobile}
              className="text-brand-cyan hover:text-brand-yellow transition-colors p-1 -ml-1"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-pixel text-lg text-brand-yellow truncate">
              <NeonGlow color="orange">{title}</NeonGlow>
            </h2>
          </div>
        )}

        {!isMobile && (
          <div className="mb-8">
            <h2 className="font-pixel text-4xl text-brand-yellow">
              <NeonGlow color="orange">{title}</NeonGlow>
            </h2>
          </div>
        )}

        {children}
      </main>
    </div>
  )
}
