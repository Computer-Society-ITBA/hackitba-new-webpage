import translations from "./translations.json"
import type { Locale } from "./config"

export function getTranslations(locale: Locale) {
  return translations[locale]
}
