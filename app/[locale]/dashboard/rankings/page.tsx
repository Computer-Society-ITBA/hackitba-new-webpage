"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { doc, onSnapshot, getDocs, collection, query, where } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { cn } from "@/lib/utils"
import { Trophy, Users, User, Medal, Loader2, Star, ArrowUp, Crown } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"

export default function PublicRankingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-12 h-12 text-brand-cyan animate-spin" />
        <p className="font-pixel text-brand-cyan animate-pulse uppercase tracking-[0.2em]">LOADING RANKING...</p>
      </div>
    }>
      <PublicRankingContent />
    </Suspense>
  )
}

function PublicRankingContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = (params?.locale as Locale) || "es"
  const id = searchParams.get("id")
  const t = getTranslations(locale)
  const db = getDbClient()

  const [ranking, setRanking] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Listen to ranking updates
  useEffect(() => {
    if (!db || !id) {
      if (!id) setLoading(false)
      return
    }

    const unsub = onSnapshot(doc(db, "rankings", id), async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setRanking({ id: snap.id, ...data })

        // Load item details (participants or teams)
        const collectionName = data.type === "participants" ? "users" : "teams"
        const snapItems = await getDocs(collection(db, collectionName))
        const itemsList = snapItems.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setItems(itemsList)
      }
      setLoading(false)
    })

    return () => unsub()
  }, [db, id])

  const leaderboard = useMemo(() => {
    if (!ranking || !items.length) return []

    const scores = ranking.scores || {}
    return Object.entries(scores)
      .map(([itemId, pts]) => {
        const item = items.find(i => i.id === itemId)
        return {
          id: itemId,
          name: item?.name || itemId,
          surname: item?.surname || "",
          points: pts as number,
          isWinner: ranking.winners?.includes(itemId)
        }
      })
      .sort((a, b) => b.points - a.points)
  }, [ranking, items])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-12 h-12 text-brand-cyan animate-spin" />
        <p className="font-pixel text-brand-cyan animate-pulse uppercase tracking-[0.2em]">Syncing Leaderboard...</p>
      </div>
    )
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-12">
        <h1 className="font-pixel text-2xl text-red-500 mb-4 tracking-tighter">SELECT A RANKING SESSION</h1>
      </div>
    )
  }

  if (!ranking && !loading) {
    return (
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-12">
        <h1 className="font-pixel text-2xl text-red-500 mb-4">404: SESSION NOT FOUND</h1>
        <p className="font-pixel text-brand-cyan/60 text-xs italic">The requested ranking session ({id}) might have been closed.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col p-6 md:p-12 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-start flex-row justify-between mb-12 gap-8 pb-8">
        <div className="text-center md:text-left">
          <h1 className="font-pixel text-3xl text-brand-yellow shadow-brand-yellow/20 text-shadow-sm uppercase">
            {ranking.name}
          </h1>
          <p className="font-pixel text-brand-cyan/60 text-md mt-1 tracking-widest leading-none">
            LIVE RANKING
          </p>
        </div>
        <div className="flex items-center gap-4 bg-brand-navy/60 px-6 py-2 rounded-full border border-brand-cyan/20 shadow-inner h-auto">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="font-pixel text-brand-cyan text-sm">LIVE FEED</span>
        </div>
      </div>

      {/* Winners Banner */}
      {ranking.winners?.length > 0 && (
        <div className="mb-12 animate-in fade-in zoom-in duration-1000">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-cyan via-brand-yellow to-brand-orange rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative bg-brand-black/80 border-2 border-brand-yellow rounded-xl p-8 flex flex-col items-center text-center gap-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent" />
              <Crown className="text-brand-yellow w-16 h-16 animate-bounce" />
              <div>
                <h2 className="font-pixel text-3xl text-brand-yellow mb-2 uppercase">
                  {ranking.winners.length === 1 ? "Official Winner" : "Official Winners"}
                </h2>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {ranking.winners.map((wId: string, idx: number) => {
                    const win = leaderboard.find(l => l.id === wId)
                    return (
                      <div key={wId} className="bg-brand-yellow/10 border border-brand-yellow/30 px-6 py-3 rounded-lg flex items-center gap-3">
                        <Medal className={cn("w-6 h-6", idx === 0 ? "text-brand-yellow" : idx === 1 ? "text-gray-400" : "text-amber-700")} />
                        <span className="font-pixel text-white text-lg">
                          {win?.name} {win?.surname}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="max-w-4xl mx-auto w-full space-y-4">
        {leaderboard.length > 0 ? (
          leaderboard.map((item, idx) => (
            <RankingRow
              key={item.id}
              item={item}
              position={idx + 1}
              total={leaderboard.length}
            />
          ))
        ) : (
          <div className="text-center py-20 border-2 w-full border-dashed border-brand-cyan/40 rounded-2xl">
            <Loader2 className="w-8 h-8 text-brand-cyan/60 mx-auto animate-spin mb-4" />
            <p className="font-pixel text-brand-cyan/60 text-xl uppercase">WAITING FOR SCORING...</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RankingRow({ item, position, total }: { item: any, position: number, total: number }) {
  const isTop3 = position <= 3

  return (
    <div
      className={cn(
        "relative flex items-center justify-between p-5 rounded-lg border-2 transition-all duration-700 hover:scale-[1.02] cursor-default",
        isTop3
          ? "bg-brand-cyan/10 border-brand-yellow shadow-[0_0_25px_rgba(255,215,0,0.1)]"
          : "bg-brand-navy/60 border-brand-cyan/40"
      )}
      style={{
        animationDelay: `${position * 100}ms`
      }}
    >
      <div className="flex items-center gap-6">
        <div className={cn(
          "w-12 h-12 rounded flex items-center justify-center font-pixel",
          position === 1 ? "bg-brand-yellow text-brand-navy shadow-[0_0_15px_rgba(255,215,0,0.5)] text-xl" :
            position === 2 ? "bg-brand-yellow text-brand-navy text-lg" :
              position === 3 ? "bg-brand-yellow text-brand-navy text-lg" :
                "bg-brand-navy/80 text-brand-cyan/60 text-sm border-2 border-brand-cyan/60"
        )}>
          {position}
        </div>
        <div>
          <h2 className="font-pixel text-xl tracking-tight leading-none flex items-center gap-3 text-brand-yellow">
            {item.name} {item.surname}
            {position === 1 && <Star className="w-5 h-5 fill-brand-yellow text-brand-yellow animate-pulse" />}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden sm:flex flex-col items-end">
          <div className="h-1.5 w-32 bg-brand-navy/80 rounded-full overflow-hidden border border-brand-cyan/20">
            <div
              className="h-full bg-brand-cyan/40 shadow-[0_0_10px_#00FFFF] transition-all duration-1000 ease-out"
              style={{ width: `${(item.points / Math.max(...[1, item.points])) * 100}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <span className="font-pixel text-2xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            {item.points}
          </span>
        </div>
      </div>

      {item.isWinner && (
        <div className="absolute -top-3 -right-3 bg-brand-yellow text-brand-navy text-xs font-pixel px-3 py-1 rounded shadow-lg animate-bounce uppercase border-2 border-brand-black">
          WINNER
        </div>
      )}
    </div>
  )
}
