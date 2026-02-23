"use client"

import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { CalendarDays, MapPin, Clock3, Ticket, Navigation, ExternalLink } from "lucide-react"
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

          {/* Map */}
          <GlassCard className="p-6">
            <h3 className="font-pixel text-lg text-brand-yellow mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              {ei.locationTitle}
            </h3>

            {/* Address block */}
            <div className="flex flex-col divide-y divide-brand-cyan/10 mb-6 rounded-lg border border-brand-cyan/10 overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3">
                <Navigation className="w-4 h-4 text-brand-cyan/50 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-pixel uppercase tracking-wider text-brand-cyan/40 mb-0.5">{ei.locationVenue}</p>
                  <p className="text-sm text-brand-cyan">{t.location.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-3">
                <MapPin className="w-4 h-4 text-brand-cyan/50 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-pixel uppercase tracking-wider text-brand-cyan/40 mb-0.5">{ei.labelsLocation}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(t.location.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-cyan hover:text-brand-orange transition-colors flex items-center gap-1"
                  >
                    {t.location.address}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-3">
                <span className="w-4 h-4 flex-shrink-0 text-center text-brand-cyan/50 text-xs font-mono leading-none mt-0.5">🌐</span>
                <div>
                  <p className="text-[10px] font-pixel uppercase tracking-wider text-brand-cyan/40 mb-0.5">Coords</p>
                  <p className="text-sm text-brand-cyan font-mono">{t.location.coordinates}</p>
                </div>
              </div>
            </div>

            <div className="relative w-full h-[320px] rounded-lg overflow-hidden border border-brand-yellow/30 shadow-lg">
              <iframe
                src="https://maps.google.com/maps?hl=en&q=Igua%C3%BA%20341%20C1437%20CABA%20Argentina+(ITBA%20Sede%20Distrito%20Tecnol%C3%B3gico)&z=15&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </GlassCard>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
