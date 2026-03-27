"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { MapPin, Navigation, ExternalLink, Clock, CalendarDays, Clock3, Ticket } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/firebase/auth-context"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { ref, getDownloadURL } from "firebase/storage"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Image as ImageIcon, Maximize2 } from "lucide-react"
import { DialogTitle } from "@radix-ui/react-dialog"

// Location metadata
const LOCATIONS = {
  uspallata: {
    name: "Uspallata 3150",
    color: "border-brand-yellow/40 bg-brand-yellow/5",
    text: "text-brand-yellow",
    map: "https://maps.app.goo.gl/PKZF763BudCf4Spe6"
  },
  sdr: {
    name: "ITBA SDR Iguazú 341",
    color: "border-brand-cyan/40 bg-brand-cyan/5",
    text: "text-brand-cyan",
    map: "https://maps.app.goo.gl/3nNTYpZv2Jxwr6BZA"
  },
  sdt: {
    name: "ITBA SDT Lavarden 315",
    color: "border-brand-orange/40 bg-brand-orange/5",
    text: "text-brand-orange",
    map: "https://maps.app.goo.gl/hAymm4erAx9yDez6A"
  }
}

// Timeline Data Structure
const TIMELINE_DATA = [
  {
    id: "friday",
    date: { es: "Viernes 27", en: "Friday 27" },
    events: [
      { time: "17:00", es: "Acreditación", en: "Check-in & Registration", loc: "uspallata" },
      { time: "17:45", es: "Inicio Acto de Apertura", en: "Opening Ceremony Start", badge: { es: "Apertura", en: "Opening" }, loc: "uspallata" },
      { time: "18:00", es: "Espacio de Charlas", en: "Speaker Sessions", loc: "uspallata" },
      { time: "19:30", es: "Fin Acto de Apertura", en: "Opening Ceremony End", loc: "uspallata" },
      { time: "20:30", timeEnd: "22:00", es: "Cena", en: "Dinner", loc: "sdr" },
      { time: "22:00", es: "Kickoff", en: "Official Kickoff", badge: { es: "Hacking", en: "Hacking" }, loc: "sdr" }
    ]
  },
  {
    id: "saturday",
    date: { es: "Sábado 28", en: "Saturday 28" },
    events: [
      { time: "08:30", timeEnd: "09:30", es: "Desayuno", en: "Breakfast", loc: "sdr" },
      { time: "10:00", timeEnd: "12:30", es: "Mentoreo de Emprendedurismo ", en: "Empreneurship mentoring", loc: "sdr" },
      { time: "13:00", timeEnd: "14:00", es: "Almuerzo", en: "Lunch", loc: "sdr" },
      { time: "15:00", timeEnd: "17:30", es: "Mentoreo de Tecnología", en: "Tech mentoring", loc: "sdr" },
      { time: "18:00", timeEnd: "19:00", es: "Merienda", en: "Afternoon Snack", loc: "sdr" },
      { time: "22:30", timeEnd: "23:30", es: "Cena", en: "Dinner", loc: "sdr" }
    ]
  },
  {
    id: "sunday",
    date: { es: "Domingo 29", en: "Sunday 29" },
    events: [
      { time: "09:00", timeEnd: "10:00", es: "Entrega de Proyectos", en: "Project Submission", badge: { es: "Cierre", en: "Deadline" }, loc: "sdr" },
      { time: "10:00", timeEnd: "11:00", es: "Desayuno", en: "Breakfast", loc: "sdr" },
      { time: "11:00", timeEnd: "12:00", es: "Mentoreo de Speaking", en: "Speaking Mentorship", loc: "sdr" },
      { time: "12:00", timeEnd: "14:00", es: "Almuerzo y Preparación", en: "Lunch & Prep", loc: "sdt" },
      { time: "14:00", es: "Acto de Cierre", en: "Closing Ceremony Start", badge: { es: "Final", en: "Finale" }, loc: "sdt" },
      { time: "17:00", es: "Fin de la HackITBA", en: "End of HackITBA", loc: "sdt" }
    ]
  }
]

export default function EventoPage() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "es"
  const t = getTranslations(locale)
  const ei = t.dashboard.eventPage
  const [activeDayId, setActiveDayId] = useState("friday")

  const activeDay = TIMELINE_DATA.find(d => d.id === activeDayId) || TIMELINE_DATA[0]
  const { user } = useAuth()
  const db = getDbClient()
  const storage = getStorageClient()

  const [assignedRoom, setAssignedRoom] = useState<string | null>(null)
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null)
  const [floorPlanUrls, setFloorPlanUrls] = useState<{ [key: string]: string }>({})
  const [loadingMaps, setLoadingMaps] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState<"PB" | "P1" | "P2">("PB")

  const isMentorOrAdmin = user?.role === "mentor" || user?.role === "admin"

  const fetchFloorPlans = useCallback(async () => {
    if (!storage) return
    const floors = ["PB", "P1", "P2"]
    const urls: { [key: string]: string } = {}

    try {
      await Promise.all(floors.map(async (floor) => {
        try {
          const url = await getDownloadURL(ref(storage, `aulas/${floor}.jpg`))
          urls[floor] = url
        } catch (err) {
          console.warn(`Error fetching floor plan ${floor}:`, err)
        }
      }))
      setFloorPlanUrls(urls)
    } finally {
      setLoadingMaps(false)
    }
  }, [storage])

  const fetchRoomMap = useCallback(async (room: string) => {
    if (!storage) return
    try {
      const url = await getDownloadURL(ref(storage, `aulas/${room}.jpg`))
      setRoomImageUrl(url)
    } catch (err) {
      console.warn(`Error fetching room map for ${room}:`, err)
    } finally {
      setLoadingMaps(false)
    }
  }, [storage])

  useEffect(() => {
    if (!db || !user) return

    const loadMapsData = async () => {
      setLoadingMaps(true)

      if (isMentorOrAdmin) {
        await fetchFloorPlans()
      } else if (user.role === "participant") {
        let teamId = user.team

        // Fallback: find team by participantIds if user.team is missing
        if (!teamId) {
          try {
            const teamsQuery = query(collection(db, "teams"), where("participantIds", "array-contains", user.id))
            const snapshot = await getDocs(teamsQuery)
            if (!snapshot.empty) {
              teamId = snapshot.docs[0].id
            }
          } catch (err) {
            console.error("Error finding team:", err)
          }
        }

        if (teamId) {
          try {
            const teamDoc = await getDoc(doc(db, "teams", teamId))
            if (teamDoc.exists()) {
              const teamData = teamDoc.data()
              if (teamData.assignedRoom) {
                setAssignedRoom(teamData.assignedRoom)
                await fetchRoomMap(teamData.assignedRoom)
              } else {
                setLoadingMaps(false)
              }
            } else {
              setLoadingMaps(false)
            }
          } catch (err) {
            console.error("Error loading team data:", err)
            setLoadingMaps(false)
          }
        } else {
          setLoadingMaps(false)
        }
      } else {
        setLoadingMaps(false)
      }
    }

    loadMapsData()
  }, [db, user, isMentorOrAdmin, fetchFloorPlans, fetchRoomMap])

  // Group events by location for the "bracket" view
  const groupedByLocation = activeDay.events.reduce((acc, event) => {
    const lastGroup = acc[acc.length - 1]
    if (lastGroup && lastGroup.loc === event.loc) {
      lastGroup.events.push(event)
    } else {
      acc.push({ loc: event.loc, events: [event] })
    }
    return acc
  }, [] as { loc: string; events: any[] }[])

  return (
    <ProtectedRoute>
      <DashboardLayout title={ei.title}>
        <div className="space-y-6 max-w-4xl mx-auto gap-6 flex flex-col">

          {/* Day Selector (Minimal) */}
          <div className="flex gap-2 justify-start mb-2">
            {TIMELINE_DATA.map((day) => {
              const isActive = activeDayId === day.id
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  className={cn(
                    "group relative px-4 md:px-6 py-3 rounded-lg border-2 transition-all duration-300 font-pixel text-xs md:text-sm uppercase tracking-wider flex items-center gap-2",
                    isActive
                      ? "border-brand-orange bg-brand-orange/10 text-brand-orange shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                      : "border-brand-cyan/20 bg-brand-black/40 text-brand-cyan/60 hover:border-brand-cyan/40 hover:text-brand-cyan hover:bg-brand-cyan/5"
                  )}
                >
                  {day.date[locale]}
                </button>
              )
            })}
          </div>

          {/* Timeline Display */}
          <div className="space-y-4">
            {groupedByLocation.map((group, gIdx) => {
              const locInfo = LOCATIONS[group.loc as keyof typeof LOCATIONS]
              return (
                <div key={gIdx} className={cn(
                  "relative pl-4 pr-4 py-4 rounded border-l-4 group/loc",
                  locInfo.color
                )}>
                  {/* Location Header/Label */}
                  <a
                    href={locInfo.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-0 right-0 mt-4 mr-4 z-10 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs uppercase font-pixel tracking-wider text-white/30 hover:text-brand-orange transition-colors">
                      <MapPin size={15} />
                      {locInfo.name}
                      <ExternalLink size={15} />
                    </div>
                  </a>

                  <div className="space-y-6">
                    {group.events.map((event, eIdx) => (
                      <div key={eIdx} className="flex gap-4 items-start relative">
                        {/* Square Marker */}
                        <div className="flex-shrink-0 mt-1.5 ml-1">
                          <div className={cn(
                            "my-2 w-3 h-3 border border-white/20 shadow-sm",
                            group.loc === "uspallata" ? "bg-brand-yellow" :
                              group.loc === "sdr" ? "bg-brand-cyan" : "bg-brand-orange"
                          )}></div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-sm font-pixel font-bold text-white/90">
                              {event.time}
                            </span>
                            {event.badge && (
                              <span className="text-xs uppercase px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/10 text-white/40">
                                {event.badge[locale]}
                              </span>
                            )}
                          </div>
                          <p className="text-md text-white/50 font-medium leading-tight mt-1">
                            {event[locale]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Secondary Info (Compact) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-brand-cyan/10">
              <div className="flex items-center gap-2 text-brand-cyan/40 text-xs uppercase mb-1">
                <CalendarDays size={12} /> {ei.labelsDate}
              </div>
              <p className="text-brand-cyan text-sm">{ei.dates}</p>
            </GlassCard>
            <GlassCard className="p-4 border-brand-cyan/10">
              <div className="flex items-center gap-2 text-brand-cyan/40 text-xs uppercase mb-1">
                <Clock3 size={12} /> {ei.labelsDuration}
              </div>
              <p className="text-brand-cyan text-sm">{ei.duration}</p>
            </GlassCard>
            <GlassCard className="p-4 border-brand-cyan/10">
              <div className="flex items-center gap-2 text-brand-cyan/40 text-xs uppercase mb-1">
                <Ticket size={12} /> {ei.labelsFormat}
              </div>
              <p className="text-brand-cyan text-sm">{ei.format}</p>
            </GlassCard>
          </div>


          {/* Room Assignment & Floor Plans Section */}
          {(assignedRoom || isMentorOrAdmin) && (
            <div className="space-y-6">
              {isMentorOrAdmin ? (
                // Mentor/Admin Floor Plan Selector
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-brand-cyan/10 flex items-center justify-center">
                      <ImageIcon className="text-brand-cyan" size={30} />
                    </div>
                    <div>
                      <h4 className="text-xl text-white font-pixel">
                        {ei.viewFloorPlan}
                      </h4>
                      <p className="text-xs text-brand-cyan/40 uppercase tracking-widest font-pixel">
                        {selectedFloor === "PB" ? ei.groundFloor : selectedFloor === "P1" ? ei.firstFloor : ei.secondFloor}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(["PB", "P1", "P2"] as const).map((floor) => (
                      <button
                        key={floor}
                        onClick={() => setSelectedFloor(floor)}
                        className={cn(
                          "group relative px-4 md:px-6 py-3 rounded-lg border-2 transition-all duration-300 font-pixel text-xs md:text-sm uppercase tracking-wider flex items-center gap-2",
                          selectedFloor === floor
                            ? "border-brand-orange bg-brand-orange/10 text-brand-orange shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                            : "border-brand-cyan/20 bg-brand-black/40 text-brand-cyan/60 hover:border-brand-cyan/40 hover:text-brand-cyan hover:bg-brand-cyan/5"
                        )}
                      >
                        {floor}
                      </button>
                    ))}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative w-full md:w-48 aspect-video rounded-lg overflow-hidden border border-brand-cyan/20 cursor-pointer hover:border-brand-cyan/50 transition-all group">
                        {loadingMaps ? (
                          <Skeleton className="w-full h-full bg-brand-cyan/5" />
                        ) : floorPlanUrls[selectedFloor] ? (
                          <>
                            <img
                              src={floorPlanUrls[selectedFloor]}
                              alt={selectedFloor}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="text-white w-6 h-6" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-brand-cyan/5 text-brand-cyan/20">
                            <ImageIcon size={24} />
                            <p className="text-xs font-pixel mt-1">EMPTY</p>
                          </div>
                        )}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 bg-transparent border-none overflow-hidden sm:rounded-2xl">
                      <DialogTitle className="sr-only">{selectedFloor}</DialogTitle>
                      {floorPlanUrls[selectedFloor] && (
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                          <img
                            src={floorPlanUrls[selectedFloor]}
                            alt={selectedFloor}
                            className="max-w-full max-h-[85vh] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                          />
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ) : assignedRoom && (
                // Participant Room Map (Simplified Layout)
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center shrink-0">
                      <MapPin className="text-brand-orange" size={30} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-pixel text-brand-cyan/40 uppercase tracking-widest leading-none">
                        {ei.room}
                      </p>
                      <h4 className="text-3xl text-brand-yellow font-pixel leading-none">
                        {assignedRoom}
                      </h4>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative w-full md:w-64 aspect-video rounded-xl overflow-hidden border border-brand-cyan/20 cursor-pointer hover:border-brand-cyan/50 transition-all group shadow-2xl">
                        {loadingMaps ? (
                          <Skeleton className="w-full h-full bg-brand-cyan/5" />
                        ) : roomImageUrl ? (
                          <>
                            <img
                              src={roomImageUrl}
                              alt={assignedRoom}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="text-white w-8 h-8" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-brand-cyan/5 text-brand-cyan/20">
                            <ImageIcon size={32} />
                            <p className="text-xs font-pixel mt-2 uppercase tracking-tighter">No Map</p>
                          </div>
                        )}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 bg-transparent border-none overflow-hidden sm:rounded-2xl">
                      <DialogTitle className="sr-only">{assignedRoom}</DialogTitle>
                      {roomImageUrl && (
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                          <img
                            src={roomImageUrl}
                            alt={assignedRoom}
                            className="max-w-full max-h-[85vh] rounded-2xl shadow-[0_0_80px_rgba(255,107,0,0.2)] border border-white/10"
                          />
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          )}


          {/* Maps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Auditorium Map */}
            <GlassCard className="p-6 h-full">
              <p className="text-sm uppercase text-brand-cyan/50">{ei.presentation}</p>
              <h3 className="font-pixel text-lg text-brand-cyan mb-4 leading-tight flex items-center gap-2">
                {ei.presentationLocation}
              </h3>

              <div className="flex flex-col divide-y divide-brand-cyan/10 mb-6 rounded-lg border border-brand-cyan/30 overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3">
                  <MapPin className="w-4 h-4 text-brand-cyan flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-pixel uppercase tracking-wider text-brand-cyan/40 mb-0.5">{ei.labelsLocation}</p>
                    <a
                      href="https://maps.app.goo.gl/3nNTYpZv2Jxwr6BZA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-cyan hover:text-brand-orange transition-colors flex items-center gap-1"
                    >
                      {ei.competitionAddress}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="relative w-full h-[280px] rounded-lg overflow-hidden border border-brand-cyan/30 shadow-lg">
                <iframe
                  src="https://maps.google.com/maps?hl=en&q=Uspallata%203150%20C1437JCJ%20CABA%20Argentina+(Sede%20del%20Gobierno)&z=15&output=embed"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </GlassCard>

            {/* Competition Map */}
            <GlassCard className="p-6 h-full">
              <p className="text-sm uppercase text-brand-cyan/50">{ei.competitionStart}</p>
              <h3 className="font-pixel text-lg text-brand-cyan mb-4 leading-tight flex items-center gap-2">
                {ei.competitionLocation}
              </h3>

              <div className="flex flex-col divide-y divide-brand-cyan/10 mb-6 rounded-lg border border-brand-cyan/30 overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3">
                  <MapPin className="w-4 h-4 text-brand-cyan flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-pixel uppercase tracking-wider text-brand-cyan/40 mb-0.5">{ei.labelsLocation}</p>
                    <a
                      href="https://maps.app.goo.gl/PKZF763BudCf4Spe6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-cyan hover:text-brand-orange transition-colors flex items-center gap-1"
                    >
                      {ei.auditorialAddress}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="relative w-full h-[280px] rounded-lg overflow-hidden border border-brand-cyan/30 shadow-lg">
                <iframe
                  src="https://maps.google.com/maps?hl=en&q=Igua%C3%BA%20341%20C1437%20CABA%20Argentina+(ITBA%20Sede%20Distrito%20Rectorado)&z=15&output=embed"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </GlassCard>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
