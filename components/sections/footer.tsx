import Link from "next/link"
import { Github, Twitter, Linkedin, Instagram } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"

interface FooterProps {
  translations: any
  locale: Locale
}

export function Footer({ translations, locale }: FooterProps) {
  const navLinks = [
    { href: `/${locale}`, label: translations.nav.home },
    { href: `/${locale}#about`, label: translations.nav.about },
    { href: `/${locale}#sponsors`, label: translations.nav.sponsors },
    { href: `/${locale}#mentors`, label: translations.nav.mentors },
    { href: `/${locale}#categories`, label: translations.nav.categories },
    { href: `/${locale}#faqs`, label: translations.nav.faqs },
    { href: `/${locale}/auth/signup?role=mentor`, label: translations.nav.beAMentor },
    { href: `/${locale}/auth/signup?role=sponsor`, label: translations.nav.beASponsor },
  ]

  const socials = [
    { icon: Github, href: "https://github.com" },
    { icon: Twitter, href: "https://twitter.com" },
    { icon: Linkedin, href: "https://linkedin.com" },
    { icon: Instagram, href: "https://instagram.com" },
  ]

  return (
    <footer className="border-t border-brand-cyan/20 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          <div>
            <h3 className="font-pixel text-lg text-brand-orange mb-4">{translations.footer.menu}</h3>
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-brand-cyan hover:text-brand-orange transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <p className="font-pixel text-brand-cyan text-center md:text-left">{translations.footer.madeWith}</p>

            <div>
              <h3 className="font-pixel text-lg text-brand-orange mb-4 text-center md:text-left">
                {translations.footer.socials}
              </h3>
              <div className="flex gap-4 justify-center md:justify-start">
                {socials.map((social, index) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-cyan hover:text-brand-orange transition-colors"
                    >
                      <Icon size={24} />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-brand-cyan/60 text-sm font-mono pt-8 border-t border-brand-cyan/10">
          © 2026 Computer Society ITBA. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
