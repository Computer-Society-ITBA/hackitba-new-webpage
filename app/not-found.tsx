"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthClient } from "@/lib/firebase/client-config"
import { onAuthStateChanged } from "firebase/auth"

import { Loading } from "@/components/ui/loading"

export default function NotFound() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Get browser locale
    const browserLang = navigator.language.toLowerCase()
    const supportedLocales = ["es", "en"]

    let locale = "es" // default

    // Check if browser language matches supported locales
    if (supportedLocales.includes(browserLang)) {
      locale = browserLang
    } else {
      // Check language prefix (e.g., "es-AR" -> "es")
      const langPrefix = browserLang.split("-")[0]
      if (supportedLocales.includes(langPrefix)) {
        locale = langPrefix
      }
    }

    // Check if user is logged in
    const auth = getAuthClient()
    if (!auth) {
      router.replace(`/${locale}`)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setChecking(false)
      // Redirect to dashboard if logged in, otherwise to home
      if (user) {
        router.replace(`/${locale}/dashboard`)
      } else {
        router.replace(`/${locale}`)
      }
    })

    return () => unsubscribe()
  }, [router])

  return <Loading text="Redirecting..." />
}
