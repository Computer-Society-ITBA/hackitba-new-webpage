"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { PixelButton } from "@/components/ui/pixel-button"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/config"
import { useAuth } from "@/lib/firebase/auth-context"

interface HeaderProps {
  translations: any
  locale: Locale
}

export function Header({ translations, locale }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, loading } = useAuth()
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "true" || process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "1"
  const signupLoading = false

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: `/${locale}#about`, label: translations.nav.about },
    { href: `/${locale}#categories`, label: translations.nav.categories },
    { href: `/${locale}#faqs`, label: translations.nav.faqs },
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
            <span className="font-pixel text-2xl md:text-3xl text-brand-yellow neon-glow-orange">
              <img className="hover:neon-glow-orange" src="/images/hackitba-icon.png" alt="" />
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-pixel text-sm text-brand-yellow neon-glow-orange hover:neon-glow-orange transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <div className="hidden md:flex gap-3">
              {!loading && user ? (
                <PixelButton asChild variant="outline" size="md">
                  <Link href={`/${locale}/dashboard`}>{translations.nav.dashboard}</Link>
                </PixelButton>
              ) : (
                <>
                  <PixelButton asChild variant="outline" size="md">
                    <Link href={`/${locale}/auth/login`}>{translations.nav.login}</Link>
                  </PixelButton>
                  <PixelButton
                    asChild={signupEnabled && !signupLoading}
                    variant="outline"
                    size="md"
                    disabled={signupLoading || !signupEnabled}
                    className={cn(signupLoading || !signupEnabled ? "opacity-50 cursor-not-allowed" : "")}
                  >
                    {signupEnabled && !signupLoading ? (
                      <Link href={`/${locale}/auth/signup`}>{translations.nav.signUp}</Link>
                    ) : (
                      <span>{translations.nav.signUp}</span>
                    )}
                  </PixelButton>
                </>
              )}
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
            <div className="px-4 pt-2 space-y-2">
              {!loading && user ? (
                <PixelButton asChild variant="outline" size="md" className="w-full">
                  <Link href={`/${locale}/dashboard`}>{translations.nav.dashboard}</Link>
                </PixelButton>
              ) : (
                <>
                  <PixelButton asChild variant="outline" size="md" className="w-full">
                    <Link href={`/${locale}/auth/login`}>{translations.nav.login}</Link>
                  </PixelButton>
                  <PixelButton
                    asChild={signupEnabled && !signupLoading}
                    variant="outline"
                    size="md"
                    className={cn("w-full", signupLoading || !signupEnabled ? "opacity-50 cursor-not-allowed" : "")}
                    disabled={signupLoading || !signupEnabled}
                  >
                    {signupEnabled && !signupLoading ? (
                      <Link href={`/${locale}/auth/signup`}>{translations.nav.signUp}</Link>
                    ) : (
                      <span>{translations.nav.signUp}</span>
                    )}
                  </PixelButton>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
