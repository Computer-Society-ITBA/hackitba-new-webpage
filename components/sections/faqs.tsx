"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQsProps {
  translations: any
}

export function FAQs({ translations }: FAQsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  // Usar la lista de FAQs desde i18n
  const faqs = translations.faqs.list || [];

  return (
    <section id="faqs" className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="flex flex-col items-center mb-12">
          <div>
            <p className="font-pixel text-md text-brand-yellow mb-2">{translations.auth.signup.endpoint?.split(" ")[0]}</p>
            <p className="font-pixel text-lg text-brand-yellow">{translations.faqs.endpoint}</p>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <button
              key={index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="cursor-pointer w-full text-left glass-effect rounded-lg p-6 transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-pixel text-xs hover:text-brand-cyan transition-all">
                  "{faq.question}":
                </h3>
                <img src="/images/flecha-abajo.png" className={cn(openIndex === index ? "rotate-180" : "", "h-6 transition-all")} alt="arrow-down" />
              </div>
              {openIndex === index && (
                <div className="mt-4 pt-4 border-t border-brand-cyan/20">
                  <p className="opacity-60 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
