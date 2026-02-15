"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQsProps {
  translations: any
}

export function FAQs({ translations }: FAQsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: translations.faqs.question,
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
      question: translations.faqs.question,
      answer:
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    {
      question: translations.faqs.question,
      answer:
        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.",
    },
    {
      question: translations.faqs.question,
      answer:
        "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
    },
  ]

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
                  "{translations.faqs.question}": "{translations.faqs.answer}"
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
