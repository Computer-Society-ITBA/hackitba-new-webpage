export const defaultLocale = "es"
export const locales = ["en", "es"] as const
export type Locale = (typeof locales)[number]

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split("/")
  const locale = segments[1]

  if (locales.includes(locale as Locale)) {
    return locale as Locale
  }

  return defaultLocale
}
