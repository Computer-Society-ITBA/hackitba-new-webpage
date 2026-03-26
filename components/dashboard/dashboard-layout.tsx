"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"

import { useAuth } from "@/lib/firebase/auth-context"
import { PixelButton } from "@/components/ui/pixel-button"
import { useRouter, useParams, usePathname } from "next/navigation"
import { NeonGlow } from "@/components/effects/neon-glow"
import Link from "next/link"
import { Home, User, LogOut, CheckSquare, UserX, Menu, X, ChevronLeft, ChevronRight, CalendarDays, Trophy, ShieldCheck, UserCheck, RotateCcw, GanttChart, FolderKanban, FileEdit, Star } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { doc, onSnapshot } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { getAuth } from "firebase/auth"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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
  const t = getTranslations(locale)
  const dashboardHomeRoutes = [
    `/${locale}/dashboard`,
    `/${locale}/dashboard/participante`,
    `/${locale}/dashboard/admin`,
    `/${locale}/dashboard/jurado`,
    `/${locale}/dashboard/mentor`,
  ]
  const isDashboardHome = dashboardHomeRoutes.includes(pathname)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showWinners, setShowWinners] = useState(false)
  const [projectSubmissionsEnabled, setProjectSubmissionsEnabled] = useState(true)
  const [hasProject, setHasProject] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [resettingSignup, setResettingSignup] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  const lockScrollY = useRef(0)

  useEffect(() => {
    const db = getDbClient()
    if (!db) return

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setShowWinners(!!data?.showWinners)
        setProjectSubmissionsEnabled(data?.projectSubmissionsEnabled !== false)
        setSignupEnabled(data?.signupEnabled !== false)
      }
    })

    let unsubProject = () => { }
    if (user?.role === "participant" && user.team) {
      unsubProject = onSnapshot(doc(db, "projects", user.team), (snap) => {
        setHasProject(snap.exists())
      })
    }

    return () => {
      unsubSettings()
      unsubProject()
    }
  }, [user?.role, user?.team])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body

    if (isMobile && mobileOpen) {
      lockScrollY.current = window.scrollY

      html.style.overflow = "hidden"
      body.style.overflow = "hidden"
      body.style.position = "fixed"
      body.style.top = `-${lockScrollY.current}px`
      body.style.left = "0"
      body.style.right = "0"
      body.style.width = "100%"
      return
    }

    html.style.overflow = ""
    body.style.overflow = ""
    body.style.position = ""
    body.style.top = ""
    body.style.left = ""
    body.style.right = ""
    body.style.width = ""

    if (lockScrollY.current > 0) {
      window.scrollTo(0, lockScrollY.current)
      lockScrollY.current = 0
    }

    return () => {
      html.style.overflow = ""
      body.style.overflow = ""
      body.style.position = ""
      body.style.top = ""
      body.style.left = ""
      body.style.right = ""
      body.style.width = ""
    }
  }, [isMobile, mobileOpen])

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

  const handleOpenResetSignupModal = () => {
    if (resettingSignup) return
    setShowResetConfirmModal(true)
  }

  const handleResetSignupFlow = async () => {
    if (!user?.id || resettingSignup) return

    setResettingSignup(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      const response = await fetch(`${apiUrl}/users/${user.id}/reset-event-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || (locale === "es" ? "No se pudo reiniciar la inscripción" : "Could not reset signup"))
      }

      toast({
        title: locale === "es" ? "Inscripción reiniciada" : "Signup reset",
        description: locale === "es" ? "Te redirigimos para que vuelvas a elegir la modalidad." : "Redirecting you to choose your registration mode again.",
      })

      setShowResetConfirmModal(false)
      if (isMobile) setMobileOpen(false)
      // Force a full navigation so auth/onboarding state is reloaded before guards run.
      window.location.assign(`/${locale}/auth/event-signup`)
    } catch (error: any) {
      toast({
        title: locale === "es" ? "Error" : "Error",
        description: error?.message || (locale === "es" ? "No se pudo completar la acción" : "Could not complete the action"),
        variant: "destructive",
      })
    } finally {
      setResettingSignup(false)
    }
  }

  const sidebarContent = (
    <>
      {/* Brand header */}
      <div className={`${isMobile ? "mb-6" : "mb-8"} ${collapsed && !isMobile ? "justify-center" : "justify-between"} ${isMobile ? "gap-3" : "gap-4"} ${isMobile && !mobileOpen ? "hidden" : "flex items-center"}`}>
        <h1 className={`font-pixel text-brand-yellow neon-glow-orange ${collapsed && !isMobile ? "text-lg" : isMobile ? "text-2xl" : "text-2xl"}`}>
          <Link href={`/${locale}`}>{collapsed && !isMobile ? "<H>" : "<HackITBA>"}</Link>
        </h1>
      </div>

      {/* Back button */}
      <div className={`${isMobile ? "mb-1" : "mb-2"}`}>
        <button
          onClick={() => { router.back(); if (isMobile) setMobileOpen(false) }}
          className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-2 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors w-full ${collapsed && !isMobile ? "justify-center" : ""}`}
          title="Back"
        >
          <div className={`relative ${isMobile ? "w-6 h-6" : "-translate-x-2 w-8 h-8"} rotate-90 flex-shrink-0`}>
            <Image src="/images/flecha-abajo.png" alt="Arrow" fill className="object-contain" />
          </div>
          {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.dashboard.sidebar.back}</span>}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isDashboardHome ? (
          <span
            className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
            title="Dashboard"
          >
            <Home size={isMobile ? 18 : 20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Dashboard</span>}
          </span>
        ) : (
          <Link
            href={`/${locale}/dashboard`}
            onClick={() => isMobile && setMobileOpen(false)}
            className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
            title="Dashboard"
          >
            <Home size={isMobile ? 18 : 20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Dashboard</span>}
          </Link>
        )}

        {user?.role === "participant" && (projectSubmissionsEnabled || hasProject) && (
          pathname === `/${locale}/dashboard/participante/proyecto` ? (
            <span
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={t.dashboard.sidebar.myProject}
            >
              <FileEdit size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.dashboard.sidebar.myProject}</span>}
            </span>
          ) : (
            <Link
              href={`/${locale}/dashboard/participante/proyecto`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={t.dashboard.sidebar.myProject}
            >
              <FileEdit size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.dashboard.sidebar.myProject}</span>}
            </Link>
          )
        )}

        {(user?.role === "judge") && (
          pathname === `/${locale}/dashboard/jurado/proyectos` ? (
            <span
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={t.dashboard.sidebar.projects}
            >
              <GanttChart size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.dashboard.sidebar.projects}</span>}
            </span>
          ) : (
            <Link
              href={`/${locale}/dashboard/jurado/proyectos`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={t.dashboard.sidebar.projects}
            >
              <GanttChart size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.dashboard.sidebar.projects}</span>}
            </Link>
          )
        )}

        {(user?.role === "judge") && (
          pathname === `/${locale}/dashboard/jurado/puntajes` ? (
            <span
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={t.judge.myScores}
            >
              <Star size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.judge.myScores}</span>}
            </span>
          ) : (
            <Link
              href={`/${locale}/dashboard/jurado/puntajes`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={t.judge.myScores}
            >
              <Star size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.judge.myScores}</span>}
            </Link>
          )
        )}

        {user?.role === "admin" && (
          pathname === `/${locale}/dashboard/admin/proyectos` ? (
            <span
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={t.dashboard.sidebar.projects}
            >
              <FolderKanban size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.dashboard.sidebar.projects}</span>}
            </span>
          ) : (
            <Link
              href={`/${locale}/dashboard/admin/proyectos`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={t.dashboard.sidebar.projects}
            >
              <FolderKanban size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{t.dashboard.sidebar.projects}</span>}
            </Link>
          )
        )}

        {user?.role !== "admin" && (pathname === `/${locale}/dashboard/evento` ? (
          <span
            className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
            title={locale === "es" ? "Evento" : "Event"}
          >
            <CalendarDays size={isMobile ? 18 : 20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{locale === "es" ? "Evento" : "Event"}</span>}
          </span>
        ) : (
          <Link
            href={`/${locale}/dashboard/evento`}
            onClick={() => isMobile && setMobileOpen(false)}
            className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
            title={locale === "es" ? "Evento" : "Event"}
          >
            <CalendarDays size={isMobile ? 18 : 20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>{locale === "es" ? "Evento" : "Event"}</span>}
          </Link>
        ))}

        {user?.role === "admin" && (
          pathname === `/${locale}/dashboard/admin/approvals` ? (
            <span
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
              title="Approvals"
            >
              <CheckSquare size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Approvals</span>}
            </span>
          ) : (
            <Link
              href={`/${locale}/dashboard/admin/approvals`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              title="Approvals"
            >
              <CheckSquare size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Approvals</span>}
            </Link>
          )
        )}

        {user?.role === "admin" && (
          pathname === `/${locale}/dashboard/admin/accreditation` ? (
            <span
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
              title="Accreditation"
            >
              <ShieldCheck size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Accreditation</span>}
            </span>
          ) : (
            <Link
              href={`/${locale}/dashboard/admin/accreditation`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              title="Accreditation"
            >
              <ShieldCheck size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Accreditation</span>}
            </Link>
          )
        )}

        {user?.role === "admin" && (
          pathname === `/${locale}/dashboard/admin/incomplete` ? (
            <span
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
              title="Incomplete"
            >
              <UserX size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Incomplete</span>}
            </span>
          ) : (
            <Link
              href={`/${locale}/dashboard/admin/incomplete`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              title="Incomplete"
            >
              <UserX size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Incomplete</span>}
            </Link>
          )
        )}

        {user?.role === "admin" && (
          pathname === `/${locale}/dashboard/winners-reveal` ? (
            <span
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan/40 cursor-default select-none ${collapsed && !isMobile ? "justify-center" : ""}`}
              title="Winners"
            >
              <Trophy size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Winners</span>}
            </span>
          ) : (
            <Link
              href={`/${locale}/dashboard/winners-reveal`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center ${isMobile ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              title="Winners"
            >
              <Trophy size={isMobile ? 18 : 20} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className={`font-pixel ${isMobile ? "text-lg" : "text-sm"}`}>Winners</span>}
            </Link>
          )
        )}
      </nav>

      {/* Profile + sign-out */}
      <div className="border-t border-brand-cyan/20 pt-2 mt-auto">
        {(!collapsed || isMobile) && (
          <p className={`${isMobile ? "px-3 pb-2" : "px-2 pb-1"} text-brand-yellow font-pixel ${isMobile ? "text-lg" : "text-xs"}`}>{user?.role.toUpperCase()}</p>
        )}

        {user?.role === "participant" && signupEnabled && (
          collapsed && !isMobile ? (
            <button
              onClick={handleOpenResetSignupModal}
              disabled={resettingSignup}
              className="w-full flex items-center justify-center py-2 text-brand-cyan hover:bg-brand-cyan/10 rounded transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={locale === "es" ? "Editar inscripción" : "Edit registration"}
            >
              <RotateCcw size={16} />
            </button>
          ) : (
            <button
              onClick={handleOpenResetSignupModal}
              disabled={resettingSignup}
              className={`w-full flex items-center gap-2 ${isMobile ? "px-3 py-2" : "px-2 py-2"} rounded text-brand-cyan hover:bg-brand-cyan/10 transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={locale === "es" ? "Editar inscripción" : "Edit registration"}
            >
              <RotateCcw size={14} className="flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <span className={isMobile ? "text-base" : "text-sm"}>
                  {resettingSignup
                    ? (locale === "es" ? "Redirigiendo..." : "Redirecting...")
                    : (locale === "es" ? "Editar inscripción" : "Edit registration")}
                </span>
              )}
            </button>
          )
        )}

        {pathname === `/${locale}/dashboard/profile` ? (
          <span
            className={`flex items-center gap-3 ${isMobile ? "px-3 py-2" : "px-2 py-3"} rounded text-brand-cyan/40 cursor-default select-none mb-2 ${collapsed && !isMobile ? "justify-center" : ""}`}
            title="Profile"
          >
            <div className="w-8 h-8 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-brand-cyan/50" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="min-w-0">
                <p className={`text-brand-cyan/60 ${isMobile ? "font-pixel text-lg" : "text-sm"} truncate`}>{user?.name} {user?.surname}</p>
                <p className="text-brand-cyan/40 text-xs truncate mt-0.5">{user?.email}</p>
              </div>
            )}
          </span>
        ) : (
          <Link
            href={`/${locale}/dashboard/profile`}
            onClick={() => isMobile && setMobileOpen(false)}
            className={`flex items-center gap-3 ${isMobile ? "px-3 py-2" : "px-2 py-3"} rounded hover:bg-brand-cyan/10 transition-colors mb-2 group ${collapsed && !isMobile ? "justify-center" : ""}`}
            title="Profile"
          >
            <div className="w-8 h-8 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-brand-cyan" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="min-w-0">
                <p className={`text-brand-cyan ${isMobile ? "font-pixel text-lg" : "text-sm"} truncate`}>{user?.name} {user?.surname}</p>
                <p className="text-brand-cyan/60 text-xs truncate mt-0.5">{user?.email}</p>
              </div>
            )}
          </Link>
        )}

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
            <p className={isMobile ? "font-pixel text-lg" : ""}>Sign Out</p>
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

      <main className={`flex-1 min-w-0 p-4 sm:p-6 md:pt-6 md:px-8 md:pb-8 transition-all duration-300 ${!isMobile ? (collapsed ? "ml-20" : "ml-64") : ""}`}>
        {/* Mobile header with hamburger */}
        {isMobile && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={toggleMobile}
              className="text-brand-cyan hover:text-brand-yellow transition-colors p-1 flex-shrink-0"
            >
              <Menu size={20} />
            </button>
            {/* <h2 className="font-pixel text-sm text-brand-yellow truncate">
              <NeonGlow color="orange">{title}</NeonGlow>
            </h2> */}
          </div>
        )}

        {/* {!isMobile && (
          <div className="mb-6">
            <h2 className="font-pixel text-2xl text-brand-yellow">
              <NeonGlow color="orange">{title}</NeonGlow>
            </h2>
          </div>
        )} */}

        {children}
      </main>

      <Dialog open={showResetConfirmModal} onOpenChange={setShowResetConfirmModal}>
        <DialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan max-w-md">
          <DialogHeader>
            <DialogTitle className="font-pixel text-brand-yellow">
              {locale === "es" ? "Cambiar forma de inscripción" : "Change registration mode"}
            </DialogTitle>
            <DialogDescription className="text-brand-cyan/80 text-sm mt-2">
              {locale === "es"
                ? "Esto te hará volver al formulario de inscripción para cambiar la modalidad. Si estás solo en tu equipo, el equipo se eliminará. ¿Querés continuar?"
                : "This will send you back to event signup to change your registration mode. If you are the only member in your team, the team will be deleted. Continue?"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4 px-3 overflow-visible">
            <PixelButton
              onClick={handleResetSignupFlow}
              disabled={resettingSignup}
              className="flex-1 hover:scale-100"
            >
              {resettingSignup
                ? (locale === "es" ? "REINICIANDO..." : "RESETTING...")
                : (locale === "es" ? "CONTINUAR" : "CONTINUE")}
            </PixelButton>
            <PixelButton
              onClick={() => setShowResetConfirmModal(false)}
              variant="outline"
              disabled={resettingSignup}
              className="flex-1 hover:scale-100"
            >
              {locale === "es" ? "CANCELAR" : "CANCEL"}
            </PixelButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
