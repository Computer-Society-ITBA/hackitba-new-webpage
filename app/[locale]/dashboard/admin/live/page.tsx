"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams } from "next/navigation"
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { cn } from "@/lib/utils"
import { Users, UserCheck, Clock, Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default function LiveDisplayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-12 h-12 text-brand-cyan animate-spin" />
        <p className="font-pixel text-brand-cyan animate-pulse">LOADING...</p>
      </div>
    }>
      <LiveDisplayContent />
    </Suspense>
  )
}

function LiveDisplayContent() {
  const params = useParams()
  const locale = (params?.locale as string) || "es"

  const db = getDbClient()
  const [arrivedUsers, setArrivedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) return

    const q = query(
      collection(db, "users"),
      where("arrived", "==", true),
      orderBy("arrivedAt", "desc"),
      limit(8)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setArrivedUsers(users)
      setLoading(false)
    }, (error) => {
      console.error("Snapshot error:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [db])

  const leftCol = arrivedUsers.slice(0, 4)
  const rightCol = arrivedUsers.slice(4, 8)

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col p-8 md:p-12 overflow-hidden">
      <div className="flex items-center justify-between mb-12 border-b-2 border-brand-cyan/20 pb-8">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-brand-cyan/10 border-2 border-brand-cyan rounded-lg flex items-center justify-center text-brand-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            <Users size={32} />
          </div>
          <div>
            <h1 className="font-pixel text-2xl text-brand-yellow shadow-brand-yellow/20 text-shadow-sm">
              {locale === "es" ? "RECIÉN LLEGADOS" : "RECENTLY ARRIVED"}
            </h1>
            <p className="font-pixel text-brand-cyan/60 text-sm">HACKITBA 2026 · ACCREDITATION LIVE</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-brand-navy/60 px-6 py-2 rounded-full border border-brand-cyan/20 shadow-inner">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="font-pixel text-brand-cyan text-md">LIVE</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 text-white">
        <div className="space-y-4">
          {leftCol.map((user, idx) => (
            <UserRow key={user.id} user={user} isNew={idx === 0} />
          ))}
          {leftCol.length === 0 && !loading && (
            <div className="h-full flex items-center justify-center text-brand-cyan/20 font-pixel text-2xl uppercase italic">
              {locale === "es" ? "Esperando ingresos..." : "Waiting for entries..."}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {rightCol.map((user) => (
            <UserRow key={user.id} user={user} isNew={false} />
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-brand-cyan/10 flex justify-between items-center text-xs font-pixel text-brand-cyan/40">
        <span>{new Date().toLocaleDateString()}</span>
        <div className="flex gap-4">
          <span>{arrivedUsers.length} {locale === "es" ? "PRESENTES" : "PRESENT"}</span>
        </div>
      </div>
    </div>
  )
}

function UserRow({ user, isNew }: { user: any, isNew: boolean }) {
  const formatTime = (ts: any) => {
    if (!ts) return "--:--"
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className={cn(
      "relative flex items-center justify-between p-5 rounded-lg border-2 transition-all duration-700",
      isNew
        ? "bg-brand-cyan/10 border-brand-yellow shadow-[0_0_20px_rgba(255,215,0,0.15)] animate-in slide-in-from-left-8 fade-in"
        : "bg-brand-navy/40 border-brand-cyan/10 group hover:border-brand-cyan/30"
    )}>
      <div className="flex items-center gap-6">
        <div className={cn(
          "w-12 h-12 rounded flex items-center justify-center font-pixel text-xs",
          isNew ? "bg-brand-yellow text-brand-navy shadow-lg" : "bg-brand-cyan/5 text-brand-cyan/30"
        )}>
          {isNew ? <UserCheck size={28} /> : <Clock size={24} />}
        </div>
        <div>
          <h2 className={cn(
            "font-pixel text-md tracking-tight leading-none",
            isNew ? "text-brand-yellow" : "text-brand-cyan"
          )}>
            {user.name} {user.surname}
          </h2>
          {isNew && (
            <span className="absolute -top-3 -right-3 bg-brand-yellow text-brand-navy text-xs font-pixel px-2 py-1 rounded shadow-lg animate-bounce uppercase">
              NEW
            </span>
          )}
        </div>
      </div>
      <div className="font-pixel text-brand-cyan/20 text-xs text-right">
        {formatTime(user.arrivedAt)}
      </div>
    </div>
  )
}
