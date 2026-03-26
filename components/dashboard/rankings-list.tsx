"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Trophy, ArrowRight, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

interface RankingsListProps {
  locale: Locale
}

export function RankingsList({ locale }: RankingsListProps) {
  const [rankings, setRankings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const db = getDbClient()
  const router = useRouter()

  useEffect(() => {
    if (!db) return

    const q = query(
      collection(db, "rankings"), 
      where("active", "==", true),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setRankings(data)
      setLoading(false)
    }, (error) => {
      console.error("Rankings snapshot error:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [db])

  if (loading) return null
  if (rankings.length === 0) return null

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      <h3 className="font-pixel text-2xl text-brand-yellow mb-6">
        {locale === "es" ? "Rankings del Evento" : "Event Rankings"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankings.map((ranking) => (
          <GlassCard key={ranking.id} className="p-6 group hover:border-brand-cyan/40 transition-all">
            <div className="flex flex-col h-full gap-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-brand-cyan/10 rounded-lg border border-brand-cyan/20 text-brand-cyan group-hover:scale-110 transition-transform">
                  <Trophy size={24} />
                </div>
                {ranking.winners?.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-pixel text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/30 px-2 py-1 rounded animate-pulse">
                    <Star size={10} className="fill-brand-yellow" />
                    WINNERS OUT
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-pixel text-lg text-white group-hover:text-brand-yellow transition-colors leading-tight">
                  {ranking.name}
                </h4>
                <p className="text-xs text-brand-cyan/40 font-pixel uppercase tracking-widest mt-2">
                  {ranking.type === "participants" ? (locale === "es" ? "Por Participante" : "By Participant") : (locale === "es" ? "Por Equipo" : "By Team")}
                </p>
              </div>

              <PixelButton 
                onClick={() => router.push(`/${locale}/dashboard/rankings?id=${ranking.id}`)}
                className="w-full mt-2" 
                size="sm"
              >
                {locale === "es" ? "Ver Ranking" : "View Ranking"}
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </PixelButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  )
}
