"use client"

import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { CalendarDays, MapPin, Clock3, Ticket, Navigation, ExternalLink, Clock } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"

export default function EventoPage() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "es"
  const t = getTranslations(locale)
  const ei = t.dashboard.eventPage

  return (
    <ProtectedRoute>
      <DashboardLayout title={ei.title}>
        <div className="space-y-8">

          {/* Timeline */}
          <GlassCard className="p-6 border border-brand-yellow/30">
            <h3 className="font-pixel text-lg text-brand-yellow mb-8 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {ei.timeline}
            </h3>

            <div className="space-y-8">
              {/* Opening Presentation */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center flex-shrink-0 pt-1">
                  <div className="w-4 h-4 rounded-full bg-brand-yellow shadow-lg shadow-brand-yellow/50 ring-3 ring-brand-yellow/40 ring-offset-2 ring-offset-brand-dark"></div>
                  <div className="w-1 h-16 bg-gradient-to-b from-brand-yellow/40 to-brand-cyan/40 mt-2"></div>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-pixel uppercase tracking-wider px-3 py-1.5 rounded-sm bg-gradient-to-r from-brand-yellow/30 to-brand-yellow/10 text-brand-yellow border border-brand-yellow/50 font-bold shadow-sm">
                        {ei.badgeOpening}
                      </span>
                      <span className="text-base font-pixel font-bold text-brand-yellow">{ei.presentationTime}</span>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-brand-cyan font-pixel mb-3">{ei.presentation}</p>
                      <a
                        href="https://maps.app.goo.gl/PKZF763BudCf4Spe6"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-brand-yellow hover:text-brand-orange transition-colors font-semibold group"
                      >
                        <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        {ei.presentationLocation}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Competition Start */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center flex-shrink-0 pt-1">
                  <div className="w-4 h-4 rounded-full bg-brand-cyan shadow-lg shadow-brand-cyan/50 ring-3 ring-brand-cyan/40 ring-offset-2 ring-offset-brand-dark"></div>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-pixel uppercase tracking-wider px-3 py-1.5 rounded-sm bg-gradient-to-r from-brand-cyan/30 to-brand-cyan/10 text-brand-cyan border border-brand-cyan/50 font-bold shadow-sm">
                        {ei.badgeCompetition}
                      </span>
                      <span className="text-base font-pixel font-bold text-brand-cyan">{ei.competitionTime}</span>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-brand-cyan font-pixel mb-3">{ei.competitionStart}</p>
                      <p className="inline-flex items-center gap-2 text-sm text-brand-cyan/80 font-semibold">
                        <MapPin className="w-4 h-4" />
                        {ei.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Info cards */}
          <GlassCard className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-brand-cyan/60 text-xs font-pixel uppercase tracking-wider mb-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {ei.labelsDate}
                </div>
                <p className="text-brand-cyan text-sm">{ei.dates}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-brand-cyan/60 text-xs font-pixel uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {ei.labelsLocation}
                </div>
                <p className="text-brand-cyan text-sm">{ei.location}</p>
                <p className="text-brand-cyan/50 text-xs">{ei.address}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-brand-cyan/60 text-xs font-pixel uppercase tracking-wider mb-1">
                  <Clock3 className="w-3.5 h-3.5" />
                  {ei.labelsDuration}
                </div>
                <p className="text-brand-cyan text-sm">{ei.duration}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-brand-cyan/60 text-xs font-pixel uppercase tracking-wider mb-1">
                  <Ticket className="w-3.5 h-3.5" />
                  {ei.labelsFormat}
                </div>
                <p className="text-brand-cyan text-sm">{ei.format}</p>
              </div>
            </div>
          </GlassCard>

          {/* Maps */}
          <div className="space-y-6">
            {/* Auditorium Map */}
            <GlassCard className="p-6">
              <h3 className="font-pixel text-lg text-brand-yellow mb-4 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                {ei.presentation} — {ei.presentationLocation}
              </h3>

              <div className="flex flex-col divide-y divide-brand-cyan/10 mb-6 rounded-lg border border-brand-yellow/30 overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3">
                  <MapPin className="w-4 h-4 text-brand-yellow flex-shrink-0" />
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

              <div className="relative w-full h-[280px] rounded-lg overflow-hidden border border-brand-yellow/30 shadow-lg">
                <iframe
                  src="https://maps.google.com/maps?hl=en&q=Uspallata%203150%20C1437JCJ%20CABA%20Argentina+(Sede%20del%20Gobierno)&z=15&output=embed"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </GlassCard>

            {/* Competition Map */}
            <GlassCard className="p-6">
              <h3 className="font-pixel text-lg text-brand-cyan mb-4 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                {ei.competitionStart} — {ei.competitionLocation}
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
