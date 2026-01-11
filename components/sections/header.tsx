"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { PixelButton } from "@/components/ui/pixel-button"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/config"

interface HeaderProps {
  translations: any
  locale: Locale
}

export function Header({ translations, locale }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: `/${locale}#past-editions`, label: translations.nav.pastEditions },
    { href: `/${locale}#faqs`, label: translations.nav.faqs },
    { href: `/${locale}#collaborate`, label: translations.nav.collaborate },
  ]

  return (
    <header
      className={cn(
        "absolute top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "glass-effect border-b border-brand-cyan/20" : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="font-pixel text-2xl md:text-3xl text-brand-orange neon-glow-orange">
              <img className="hover:neon-glow-orange" src="/images/hackitba-icon.png" alt="" />
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-pixel text-sm text-brand-yellow hover:neon-glow-orange transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <div className="hidden md:block">
              <PixelButton asChild variant="outline" size="md">
                <Link href={`/${locale}/auth/signup`}>{translations.nav.signUp}</Link>
              </PixelButton>
            </div>
          </nav>



          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-brand-cyan p-2">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden glass-effect border-t border-brand-cyan/20 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block font-pixel text-sm text-brand-cyan hover:neon-glow-cyan transition-all px-4 py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2">
              <PixelButton asChild variant="outline" size="md" className="w-full">
                <Link href={`/${locale}/auth/signup`}>{translations.nav.signUp}</Link>
              </PixelButton>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
