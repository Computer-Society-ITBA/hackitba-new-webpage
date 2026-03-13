"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { Loading } from "@/components/ui/loading"

export default function CreateTeamPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)

  useEffect(() => {
    // Team creation now happens inline during event signup.
    router.replace(`/${locale}/dashboard/participante`)
  }, [router, locale])

  return <Loading text={translations.redirecting} />
}
