"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { SignupForm } from "@/components/auth/signup-form"
import { Loading } from "@/components/ui/loading"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"

export default function MentorJudgeSignupPage() {
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)

  return (
    <Suspense fallback={<Loading text={translations.auth.signup.loading} />}>
      <SignupForm collaboratorRoute />
    </Suspense>
  )
}