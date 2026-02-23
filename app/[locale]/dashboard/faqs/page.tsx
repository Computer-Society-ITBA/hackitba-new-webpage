"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"

export default function FaqsPage() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "es"
  const t = getTranslations(locale)
  const faqs: { question: string; answer: string }[] = t.faqs.list || []

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const title = locale === "es" ? "FAQs" : "FAQs"

  return (
    <ProtectedRoute>
      <DashboardLayout title={title}>
        <div className="space-y-2">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <button
                key={index}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left rounded-lg border border-brand-cyan/10 bg-brand-navy/30 hover:border-brand-cyan/30 hover:bg-brand-navy/50 transition-all duration-200 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="font-pixel text-xs text-brand-cyan leading-relaxed">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-brand-cyan/50 flex-shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-brand-cyan/10">
                    <p className="text-sm text-brand-cyan/70 leading-relaxed pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
