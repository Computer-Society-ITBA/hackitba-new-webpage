"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, where, orderBy, setDoc, serverTimestamp } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, Plus, Search, Star, Dices, Trash2, ExternalLink, User, Users, CheckCircle, Crown, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/config"
import { Button } from "../ui/button"

interface AdminRankingsProps {
  locale: Locale
}

export function AdminRankings({ locale }: AdminRankingsProps) {
  const db = getDbClient()
  const [rankings, setRankings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRanking, setNewRanking] = useState({ name: "", type: "participants" as "participants" | "teams" })

  const [searchTerm, setSearchTerm] = useState("")
  const [activeRankingId, setActiveRankingId] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [winnerCount, setWinnerCount] = useState<number>(3)

  useEffect(() => {
    if (!db) return

    const q = query(collection(db, "rankings"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setRankings(data)
      setLoading(false)
    })

    // Load users and teams for search
    const loadSearchData = async () => {
      const [usersSnap, teamsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "teams"))
      ])
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setTeams(teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }
    loadSearchData()

    return () => unsubscribe()
  }, [db])

  const handleCreateRanking = async () => {
    if (!db || !newRanking.name) return

    // ID as name (slugified)
    const id = newRanking.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      await setDoc(doc(db, "rankings", id), {
        name: newRanking.name,
        type: newRanking.type,
        scores: {},
        winners: [],
        createdAt: serverTimestamp(),
        active: true
      })
      setShowCreateForm(false)
      setNewRanking({ name: "", type: "participants" })
      toast({ title: locale === "es" ? "Ranking creado" : "Ranking created" })
    } catch (error) {
      console.error("Error creating ranking:", error)
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const handleDeleteRanking = async (id: string) => {
    if (!db || !confirm(locale === "es" ? "¿Eliminar ranking?" : "Delete ranking?")) return
    await deleteDoc(doc(db, "rankings", id))
  }

  const handleAddPoints = async (rankingId: string, targetId: string, points: number) => {
    if (!db) return
    const ranking = rankings.find(r => r.id === rankingId)
    if (!ranking) return

    const currentScores = ranking.scores || {}
    const newScores = {
      ...currentScores,
      [targetId]: (currentScores[targetId] || 0) + points
    }

    try {
      await updateDoc(doc(db, "rankings", rankingId), { scores: newScores })
      toast({
        title: locale === "es" ? "Puntos agregados" : "Points added",
        description: `+${points} points`
      })
    } catch (error) {
      console.error("Error adding points:", error)
    }
  }

  const handleSelectWinners = async (rankingId: string, mode: "top" | "raffle", count: number = 3) => {
    if (!db) return
    const ranking = rankings.find(r => r.id === rankingId)
    if (!ranking) return

    const scores = ranking.scores || {}
    const sortedIds = Object.keys(scores).sort((a, b) => scores[b] - scores[a])

    let winners: string[] = []
    if (mode === "top") {
      winners = sortedIds.slice(0, count)
    } else {
      // Raffle: weighted by points
      const entries: string[] = []
      Object.entries(scores).forEach(([id, pts]) => {
        for (let i = 0; i < (pts as number); i++) entries.push(id)
      })

      const selected = new Set<string>()
      const maxWinners = Math.min(count, Object.keys(scores).length)
      while (selected.size < maxWinners && entries.length > 0) {
        const randomIndex = Math.floor(Math.random() * entries.length)
        const winnerId = entries[randomIndex]
        selected.add(winnerId)
        // Distinct winners
        const nextEntries = entries.filter(e => e !== winnerId)
        entries.splice(0, entries.length, ...nextEntries)
      }
      winners = Array.from(selected)
    }

    try {
      await updateDoc(doc(db, "rankings", rankingId), { winners })
      toast({ title: locale === "es" ? "Ganadores seleccionados" : "Winners selected" })
    } catch (error) {
      console.error("Error selecting winners:", error)
    }
  }

  const filteredSearch = useMemo(() => {
    if (!searchTerm || !activeRankingId) return []
    const ranking = rankings.find(r => r.id === activeRankingId)
    if (!ranking) return []

    const data = ranking.type === "participants" ? users : teams
    const lowerSearch = searchTerm.toLowerCase()

    return data.filter(item => {
      const name = `${item.name || ""} ${item.surname || ""}`.toLowerCase()
      const matches = name.includes(lowerSearch) || item.id.toLowerCase().includes(lowerSearch)
      return matches
    }).slice(0, 5)
  }, [searchTerm, activeRankingId, rankings, users, teams])

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-pixel text-2xl text-brand-yellow flex items-center gap-3">
          {locale === "es" ? "Rankings dinámicos" : "Dynamic Rankings"}
        </h3>
        <PixelButton onClick={() => setShowCreateForm(!showCreateForm)} size="sm" variant="primary">
          <Plus size={16} className="mr-2" />
          {locale === "es" ? "Nuevo Ranking" : "New Ranking"}
        </PixelButton>
      </div>

      {showCreateForm && (
        <GlassCard className="p-6 border-brand-cyan/30 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-brand-cyan font-pixel text-xs">Name</Label>
              <Input
                value={newRanking.name}
                onChange={(e) => setNewRanking({ ...newRanking, name: e.target.value })}
                placeholder="e.g. Best UI, Community Choice"
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan font-pixel"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-cyan font-pixel text-xs">Type</Label>
              <select
                value={newRanking.type}
                onChange={(e) => setNewRanking({ ...newRanking, type: e.target.value as any })}
                className="w-full h-10 bg-brand-navy/50 border border-brand-cyan/30 rounded-md px-3 text-brand-cyan text-xs font-pixel"
              >
                <option value="participants">Participants</option>
                <option value="teams">Teams</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <PixelButton size="sm" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</PixelButton>
            <PixelButton size="sm" variant="primary" onClick={handleCreateRanking}>Create</PixelButton>
          </div>
        </GlassCard>
      )}

      <div className="grid gap-4">
        {rankings.map(ranking => (
          <GlassCard key={ranking.id} className="p-5 border-brand-cyan/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

              <div className="flex items-center gap-3">
                <h4 className="font-pixel text-brand-yellow text-sm">{ranking.name}</h4>
                <span className="text-xs bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded border border-brand-cyan/20 uppercase font-pixel tracking-widest">
                  {ranking.type}
                </span>
              </div>

              <div className="flex gap-2 items-center">
                <Button
                  className="text-brand-yellow"
                  size="sm"
                  variant="link"
                  onClick={() => window.open(`/${locale}/dashboard/rankings?id=${ranking.id}`, "_blank")}
                >
                  <ExternalLink size={14} className="mr-2" />
                  Page
                </Button>

                <Button
                  className="text-brand-yellow"
                  size="sm"
                  onClick={() => setActiveRankingId(activeRankingId === ranking.id ? null : ranking.id)}
                  variant={activeRankingId === ranking.id ? "default" : "link"}
                >
                  <Search size={14} className="mr-2" />
                  {activeRankingId === ranking.id ? "Close Search" : "Add Points"}
                </Button>

                <div className="flex items-center gap-2 border border-brand-cyan/20 rounded p-1 bg-brand-navy/40">
                  <div className="flex flex-col items-center px-2 border-r border-brand-cyan/10">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={winnerCount}
                      onChange={(e) => setWinnerCount(parseInt(e.target.value) || 1)}
                      className="w-8 bg-transparent text-center text-xs font-pixel text-brand-yellow focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleSelectWinners(ranking.id, "top", winnerCount)}
                    className="p-1.5 hover:bg-brand-yellow/10 text-brand-yellow rounded transition-colors"
                    title={`Select Top ${winnerCount}`}
                  >
                    <Crown size={16} />
                  </button>
                  <button
                    onClick={() => handleSelectWinners(ranking.id, "raffle", winnerCount)}
                    className="p-1.5 hover:bg-brand-orange/10 text-brand-yellow rounded transition-colors"
                    title={`Raffle ${winnerCount} Winner(s)`}
                  >
                    <Dices size={16} />
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteRanking(ranking.id)}
                  className="p-2 text-brand-cyan/40 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {activeRankingId === ranking.id && (
              <div className="mt-6 pt-6 border-t border-brand-cyan/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan/40" />
                  <Input
                    placeholder={ranking.type === "participants" ? "Search participant name..." : "Search team name..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-brand-navy/60 border-brand-cyan/40 font-pixel text-xs"
                    autoFocus
                  />
                </div>

                <div className="grid gap-2">
                  {filteredSearch.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-brand-navy/40 border border-brand-cyan/5 rounded hover:border-brand-cyan/20 transition-all">
                      <div className="flex items-center gap-3">
                        {ranking.type === "participants" ? <User size={16} className="text-brand-cyan/60" /> : <Users size={16} className="text-brand-cyan/60" />}
                        <div>
                          <p className="text-sm font-pixel text-brand-cyan leading-none">
                            {item.name} {item.surname || ""}
                          </p>
                          <p className="text-xs text-brand-cyan/60 font-mono mt-1">{item.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-pixel text-brand-yellow mr-2">
                          {(ranking.scores?.[item.id] || 0)} pts
                        </span>
                        <PixelButton size="sm" onClick={() => handleAddPoints(ranking.id, item.id, 1)} className="h-7 px-3 text-xs" variant="primary">
                          +1
                        </PixelButton>
                        <PixelButton size="sm" onClick={() => handleAddPoints(ranking.id, item.id, 5)} className="h-7 px-3 text-xs" variant="outline">
                          +5
                        </PixelButton>
                      </div>
                    </div>
                  ))}
                  {searchTerm && filteredSearch.length === 0 && (
                    <p className="text-center text-xs text-brand-cyan/30 py-4 italic font-pixel">No matches found</p>
                  )}
                </div>
              </div>
            )}

            {ranking.winners && ranking.winners.length > 0 && (
              <div className="mt-4 flex items-center gap-2 bg-brand-yellow/5 border border-brand-yellow/20 p-2 rounded">
                <CheckCircle size={14} className="text-brand-yellow" />
                <span className="text-xs font-pixel text-brand-yellow uppercase">
                  {ranking.winners.length === 1 ? "Winner Selected:" : "Winners Selected:"}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {ranking.winners.map((wId: string) => {
                    const winner = (ranking.type === "participants" ? users : teams).find(i => i.id === wId)
                    return (
                      <span key={wId} className="text-xs font-pixel text-brand-cyan bg-brand-cyan/5 px-2 py-0.5 rounded border border-brand-cyan/10">
                        {winner?.name || wId}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </GlassCard>
        ))}

        {!loading && rankings.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-brand-cyan/10 rounded-xl">
            <Trophy size={48} className="mx-auto text-brand-cyan/10 mb-4" />
            <p className="text-xs font-pixel text-brand-cyan/40">NO RANKINGS CREATED YET</p>
          </div>
        )}
      </div>
    </section>
  )
}
