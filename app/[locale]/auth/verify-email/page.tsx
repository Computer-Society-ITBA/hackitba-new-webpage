import { Suspense } from "react"
import { VerifyEmailContent } from "./verify-email-content"

function VerifyEmailLoading() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="text-gray-300 mt-4">Cargando...</p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
