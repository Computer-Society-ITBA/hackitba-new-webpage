import Link from "next/link"
import { Github, Twitter, Linkedin, Instagram } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"

interface FooterProps {
  translations: any
  locale: Locale
}

export function Footer({ translations, locale }: FooterProps) {
  const navLinks = [
    {
      href: `/${locale}`, label: translations.nav.home, sublinks:
        [{ href: `/${locale}#about`, label: translations.nav.about },
        { href: `/${locale}#sponsors`, label: translations.nav.sponsors },
        { href: `/${locale}#mentors`, label: translations.nav.mentors },
        { href: `/${locale}#categories`, label: translations.nav.categories },
        { href: `/${locale}#faqs`, label: translations.nav.faqs },]
    },
    { href: `/${locale}/auth/signup`, label: translations.nav.signUp },
  ]

  const socials = [
    { icon: Github, href: "https://github.com/Computer-Society-ITBA" },
    { icon: Twitter, href: "https://x.com/cs_itba" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/itba-computer-society/" },
    { icon: Instagram, href: "https://www.instagram.com/computer.society.itba/" },
  ]

  return (
    <footer className="bg-brand-black border-t border-brand-cyan/20 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-2 gap-12 mb-8">
          <div className="justify-self-end">
            <h3 className="font-pixel text-xs text-brand-cyan mb-4">{translations.footer.menu}</h3>
            <div className="space-y-2">
              {navLinks.map((link, index) => (
                <div key={index} className="space-y-1">
                  {/* parent link */}
                  <Link
                    href={link.href}
                    className="block hover:text-brand-orange transition-colors text-sm"
                  >
                    {link.label}
                  </Link>

                  {/* sublinks */}
                  {link.sublinks?.map((sublink, subIndex) => (
                    <Link
                      key={subIndex}
                      href={sublink.href}
                      className="block pl-4 text-sm opacity-80 hover:text-brand-orange transition-colors"
                    >
                      {sublink.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>

          </div>

          <div className="space-y-6">
            <p className="font-pixel text-xs text-brand-cyan text-center md:text-left">
              {(() => {
                const madeWith: string = translations.footer.madeWith || ''
                const heart = '🧡'
                if (madeWith.includes(heart)) {
                  const parts = madeWith.split(heart)
                  return (
                    <>
                      {parts[0]}
                      <Link href={`/${locale}/credits`} className="hover:scale-125 inline-block transition-transform">
                        {heart}
                      </Link>
                      {parts[1]}
                    </>
                  )
                }
                // Fallback: render original string
                return madeWith
              })()}
            </p>

            <p>
              <Link href={"mailto:computersociety@itba.edu.ar"} className="flex flex-col text-xs hover:text-brand-orange transition-colors">
                {translations.footer.collaborate.split("\\n").map((line: string, index: number) => (
                  <span key={index}>{line}</span>
                ))}
              </Link>
            </p>

            <div>
              <h3 className="font-pixel text-xs text-brand-cyan mb-4 text-center md:text-left">
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

        <div className="text-center opacity-60 text-sm pt-8 border-t border-brand-cyan/10 flex flex-col gap-2">
          {translations.footer.copyright}
          <Link href={`/${locale}/credits`} className="hover:scale-115 transition-transform">
            {translations.footer.credits}
          </Link>
        </div>
      </div>
    </footer>
  )
}
