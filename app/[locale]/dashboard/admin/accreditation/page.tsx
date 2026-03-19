"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { collection, getDocs, getDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { CheckCircle2, XCircle, Search, User as UserIcon, MapPin, Users, Briefcase, Award, Loader2, ArrowLeft } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"

export default function AccreditationPage() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "es"

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title={locale === "es" ? "Acreditación" : "Accreditation"}>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="w-12 h-12 text-brand-cyan animate-spin" />
            <p className="font-pixel text-brand-cyan animate-pulse">
              {locale === "es" ? "Cargando..." : "Loading..."}
            </p>
          </div>
        }>
          <AccreditationContent locale={locale} />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function AccreditationContent({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const db = getDbClient()
  const { categories: allCategories } = useCategories(locale)

  const userIdFromUrl = searchParams.get("userId")

  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(!userIdFromUrl)

  useEffect(() => {
    if (userIdFromUrl && db) {
      loadUser(userIdFromUrl)
    }
  }, [userIdFromUrl, db])

  const loadUser = async (id: string) => {
    if (!db) return
    setLoading(true)
    try {
      const userDoc = await getDoc(doc(db, "users", id))
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as any
        setUser(userData)
        setShowSearch(false)

        // Load team info if exists
        if (userData.team) {
          const teamDoc = await getDoc(doc(db, "teams", userData.team))
          if (teamDoc.exists()) {
            setTeam({ id: teamDoc.id, ...teamDoc.data() })
          } else {
            setTeam(null)
          }
        } else {
          setTeam(null)
        }
      } else {
        toast({
          title: locale === "es" ? "Usuario no encontrado" : "User not found",
          variant: "destructive"
        })
        setShowSearch(true)
      }
    } catch (error) {
      console.error("Error loading user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!db || !searchTerm.trim()) return
    setSearching(true)
    try {
      const usersSnap = await getDocs(collection(db, "users"))
      const term = searchTerm.toLowerCase()
      const results = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => {
          const fullName = `${u.name || ""} ${u.surname || ""}`.toLowerCase()
          return fullName.includes(term) || u.email?.toLowerCase().includes(term)
        })
        .sort((a: any, b: any) => {
          if (a.arrived && !b.arrived) return 1
          if (!a.arrived && b.arrived) return -1
          return 0
        })
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleConfirm = async () => {
    if (!db || !user) return
    setLoading(true)
    try {
      await updateDoc(doc(db, "users", user.id), {
        arrived: true,
        arrivedAt: serverTimestamp()
      })
      toast({
        title: locale === "es" ? "Acreditación Exitosa" : "Accreditation Successful",
        description: `${user.name} ${user.surname || ""} ha ingresado.`
      })
      setUser(null)
      setShowSearch(true)
    } catch (error) {
      console.error("Confirmation error:", error)
      toast({
        title: "Error",
        description: locale === "es" ? "No se pudo actualizar el estado." : "Could not update status.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (categoryValue: any) => {
    if (categoryValue === null || categoryValue === undefined) return "-"
    const idx = parseInt(categoryValue)
    const category = allCategories.find(c => c.id === String(idx))
    return category ? category.name : "-"
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between min-h-[40px]">
        {!showSearch && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(true)}
          >
            <Search size={16} className="mr-2" />
            {locale === "es" ? "Buscar otro" : "Search other"}
          </Button>
        )}
      </div>

      {loading && !user ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="w-12 h-12 text-brand-cyan animate-spin" />
          <p className="font-pixel text-brand-cyan animate-pulse">
            {locale === "es" ? "Cargando datos..." : "Loading data..."}
          </p>
        </div>
      ) : showSearch ? (
        /* SEARCH INTERFACE */
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="font-pixel text-xl text-brand-yellow">
            {locale === "es" ? "Buscar Participante" : "Search Participant"}
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder={locale === "es" ? "Nombre o Email..." : "Name or Email..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
            />
            <Button variant="outline" onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </Button>
          </div>

          <div className="grid gap-3 mt-6">
            {searchResults.map((result) => (
              <GlassCard
                key={result.id}
                neonOnHover={!result.arrived}
                className={cn(
                  "cursor-pointer group transition-all",
                  result.arrived ? "opacity-40 grayscale pointer-events-none" : ""
                )}
                onClick={() => !result.arrived && loadUser(result.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.arrived && <CheckCircle2 size={16} className="text-green-500" />}
                    <div>
                      <p className={cn(
                        "font-pixel",
                        result.arrived ? "text-brand-cyan/60" : "text-brand-cyan group-hover:text-brand-yellow transition-colors"
                      )}>
                        {result.name} {result.surname}
                      </p>
                      <p className="text-xs text-brand-cyan/60">{result.email}</p>
                    </div>
                  </div>
                  <div className="text-brand-cyan/40">
                    {result.arrived ? <CheckCircle2 size={20} className="text-green-500/50" /> : <UserIcon size={20} />}
                  </div>
                </div>
              </GlassCard>
            ))}
            {searchTerm && searchResults.length === 0 && !searching && (
              <p className="text-center text-brand-cyan/40 py-8">
                {locale === "es" ? "No se encontraron resultados" : "No results found"}
              </p>
            )}
          </div>
        </div>
      ) : user ? (
        /* USER DATA INTERFACE */
        <div className="space-y-6 animate-in zoom-in-95 duration-300">

          {user.arrived && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-center justify-center gap-2 text-green-400 font-pixel text-sm">
              <CheckCircle2 size={18} />
              {locale === "es" ? "YA ACREDITADO" : "ALREADY ACCREDITED"}
            </div>
          )}

          <GlassCard className="p-8 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-brand-cyan/5 rounded-full blur-3xl" />

            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div>
                <h1 className="font-pixel text-xl text-brand-yellow drop-shadow-sm">
                  {user.name} {user.surname}
                </h1>
                <p className="text-brand-cyan/60 font-mono text-sm tracking-widest uppercase mt-1">
                  ID: {user.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="flex items-center gap-4 bg-brand-navy/30 p-4 rounded-xl border border-brand-cyan/10">
                <div className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-brand-cyan/80 uppercase">Team</p>
                  <p className="font-pixel text-brand-cyan text-sm">{team?.name || (locale === "es" ? "Sin equipo" : "No team")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 bg-brand-navy/30 p-4 rounded-xl border border-brand-cyan/10">
                  <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-brand-orange/80 uppercase">Category</p>
                    <p className="font-pixel text-brand-orange text-sm">
                      {getCategoryName(team ? (team.category ?? team.category_1) : user.category_1)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-brand-navy/30 p-4 rounded-xl border border-brand-cyan/10">
                  <div className="p-2 bg-brand-yellow/10 rounded-lg text-brand-yellow">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-brand-yellow/80 uppercase">Room</p>
                    <p className="font-pixel text-brand-yellow text-sm">{team?.assignedRoom || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-brand-navy/30 p-4 rounded-xl border border-brand-cyan/10">
                <div className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="text-xs text-brand-cyan/80 uppercase">Occupation / University</p>
                  <p className="font-pixel text-brand-cyan text-xs leading-relaxed">
                    {user.position || user.career || user.university || "-"}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              className="h-16 text-lg bg-red-500 hover:bg-red-600 border-red-700"
              onClick={() => setShowSearch(true)}
              disabled={loading}
            >
              <XCircle size={24} className="mr-2" />
              {locale === "es" ? "Incorrecto" : "Incorrect"}
            </Button>

            <Button
              className={cn(
                "h-16 text-lg",
                user.arrived ? "bg-gray-600 border-gray-800" : "bg-green-500 hover:bg-green-600 border-green-700"
              )}
              onClick={handleConfirm}
              disabled={loading || user.arrived}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <CheckCircle2 size={24} className="mr-2" />
                  {locale === "es" ? "Correcto" : "Correct"}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
