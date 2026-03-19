"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { MapPin, Navigation, ExternalLink, Clock, CalendarDays, Clock3, Ticket } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

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
      { time: "16:15", es: "Acreditación", en: "Check-in & Registration", loc: "uspallata" },
      { time: "17:00", es: "Inicio Acto de Apertura", en: "Opening Ceremony Start", badge: { es: "Apertura", en: "Opening" }, loc: "uspallata" },
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
