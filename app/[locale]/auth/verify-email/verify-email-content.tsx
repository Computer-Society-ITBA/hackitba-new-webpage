"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { NeonGlow } from "@/components/effects/neon-glow"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { ArrowLeft, Home, CheckCircle, AlertCircle, Loader } from "lucide-react"

export function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as Locale
  const token = searchParams.get("token")
  const translations = getTranslations(locale)

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Token de verificación no encontrado. Por favor, verifica el link del email.")
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://us-central1-webpage-36e40.cloudfunctions.net/api"
        
        const response = await fetch(`${apiUrl}/users/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setEmail(data.email)
          setStatus("success")
          setMessage(data.message || "¡Email verificado exitosamente!")
          
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => {
            router.push(`/${locale}/dashboard`)
          }, 3000)
        } else {
          setStatus("error")
          setMessage(data.error || "Error al verificar el email. Por favor, intenta de nuevo.")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setStatus("error")
        setMessage("Error al conectar con el servidor. Por favor, intenta de nuevo más tarde.")
      }
    }

    verifyEmail()
  }, [token, locale, router])

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <NeonGlow variant="orange" position="top-left" />
      <NeonGlow variant="blue" position="bottom-right" />
      
      <GlassCard className="w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Verificación de Email</h1>
            <p className="text-gray-400">Estamos verificando tu dirección de correo</p>
          </div>

          {/* Status Content */}
          <div className="flex flex-col items-center justify-center py-8">
            {status === "loading" && (
              <>
                <Loader className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                <p className="text-gray-300">Verificando tu email...</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-gray-300 text-center mb-4">
                  {message}
                </p>
                {email && (
                  <p className="text-sm text-gray-400 mb-4">
                    {email}
                  </p>
                )}
                <p className="text-sm text-gray-400 text-center">
                  Redirigiendo al dashboard en unos segundos...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-gray-300 text-center">
                  {message}
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Link href={`/${locale}/dashboard`} className="w-full">
              <PixelButton className="w-full">
                Ir al Dashboard
              </PixelButton>
            </Link>
            
            <Link href={`/${locale}`} className="w-full">
              <PixelButton variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Volver al inicio
              </PixelButton>
            </Link>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>¿Problemas? <Link href={`/${locale}`} className="text-orange-500 hover:text-orange-400">
              Contacta soporte
            </Link></p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
