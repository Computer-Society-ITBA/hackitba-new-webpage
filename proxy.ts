import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { locales, defaultLocale } from "./lib/i18n/config"

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the pathname is missing a locale
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  if (pathnameHasLocale) return

  // Redirect to default locale
  const locale = defaultLocale
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
}
