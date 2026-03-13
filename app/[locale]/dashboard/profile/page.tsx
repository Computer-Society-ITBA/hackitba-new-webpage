"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useParams, useRouter } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { useAuth } from "@/lib/firebase/auth-context"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Github, Linkedin, Instagram, Twitter, ExternalLink, Utensils } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getAuth } from "firebase/auth"

import { Textarea } from "@/components/ui/textarea"

export default function ProfilePage() {
  const params = useParams()
  const locale = params.locale as Locale
  const router = useRouter()
  const translations = getTranslations(locale)
  const { user, loading } = useAuth()
  const db = getDbClient()

  const [profileForm, setProfileForm] = useState({
    github: "",
    link_cv: "",
    linkedin: "",
    instagram: "",
    twitter: "",
    food_preference: "",
  })

  const [mentorForm, setMentorForm] = useState({
    name: "",
    position: "",
    company: "",
    englishBio: "",
    spanishBio: "",
    linkedin: "",
    github: "",
    instagram: "",
    twitter: "",
    categories: [] as ("entrepreneurship" | "tech" | "oratory")[],
  })



  const [showProfileForm, setShowProfileForm] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [resettingSignup, setResettingSignup] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)

  // Load signup enabled setting
  useEffect(() => {
    if (!db) return
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setSignupEnabled(data?.signupEnabled !== false)
        } else {
          setSignupEnabled(true)
        }
      } catch (err) {
        console.error("Error loading signup setting:", err)
        setSignupEnabled(true)
      }
    }
    loadSettings()
  }, [db])

  // Check onboarding completion and redirect if needed
  useEffect(() => {
    if (!loading && user && !hasRedirected) {
      setHasRedirected(true)
      const onboardingStep = user.onboardingStep || 0

      console.log("ProfilePage - User onboarding step:", onboardingStep, typeof onboardingStep)

      if (Number(onboardingStep) < 2) {
        if (signupEnabled) {
          console.log("Redirecting to event-signup because step < 2")
          router.replace(`/${locale}/auth/event-signup`)
        } else {
          console.log("Signup disabled, redirecting to home")
          router.replace(`/${locale}`)
        }
      }
    }
  }, [user, loading, router, locale, hasRedirected, signupEnabled])

  useEffect(() => {
    if (user) {
      setProfileForm({
        github: user.github || "",
        link_cv: user.link_cv || "",
        linkedin: user.linkedin || "",
        instagram: user.instagram || "",
        twitter: user.twitter || "",
        food_preference: user.food_preference || "",
      })

      // Load mentor data if user is mentor or judge
      if ((user.role === "mentor" || user.role === "judge") && db) {
        const loadMentorData = async () => {
          try {
            const collectionName = user.role === "mentor" ? "mentors" : "judges"
            const snapshot = await getDocs(
              query(collection(db, collectionName), where("email", "==", user.email))
            )
            if (snapshot.docs.length > 0) {
              const data = snapshot.docs[0].data()
              setMentorForm({
                name: data.name || "",
                position: data.position || "",
                company: data.company || "",
                englishBio: data.englishBio || "",
                spanishBio: data.spanishBio || "",
                linkedin: data.linkedin || "",
                github: data.github || "",
                instagram: data.instagram || "",
                twitter: data.twitter || "",
                categories: (user.role === "mentor" && data.categories) ? data.categories : [],
              })
              setPhotoPreview(data.avatar || null)
            }
          } catch (err) {
            console.error("Error loading mentor data:", err)
          }
        }
        loadMentorData()
      }
    }
  }, [user, db])



  const saveProfile = async () => {
    if (!db || !user?.id) return

    setSavingProfile(true)
    try {
      await updateDoc(doc(db, "users", user.id), {
        github: profileForm.github || "",
        link_cv: profileForm.link_cv || "",
        linkedin: profileForm.linkedin || "",
        instagram: profileForm.instagram || "",
        twitter: profileForm.twitter || "",
        food_preference: profileForm.food_preference || "",
        updatedAt: new Date(),
      })

      toast({
        title: translations.dashboard.profile.toasts.updated.title,
        description: translations.dashboard.profile.toasts.updated.description,
      })

      setShowProfileForm(false)
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: translations.dashboard.profile.toasts.error.title,
        description: translations.dashboard.profile.toasts.error.description,
        variant: "destructive",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const saveMentorProfile = async () => {
    if (!db || !user) return

    setSavingProfile(true)
    try {
      const collectionName = user.role === "mentor" ? "mentors" : "judges"
      const snapshot = await getDocs(
        query(collection(db, collectionName), where("email", "==", user.email))
      )

      if (snapshot.docs.length > 0) {
        const docId = snapshot.docs[0].id
        const updatePayload: any = {
          name: mentorForm.name,
          position: mentorForm.position,
          company: mentorForm.company,
          englishBio: mentorForm.englishBio,
          spanishBio: mentorForm.spanishBio,
          linkedin: mentorForm.linkedin || "",
          github: mentorForm.github || "",
          instagram: mentorForm.instagram || "",
          twitter: mentorForm.twitter || "",
          updatedAt: new Date(),
        }

        if (user.role === "mentor") {
          updatePayload.categories = mentorForm.categories
        }

        await updateDoc(doc(db, collectionName, docId), updatePayload)
      }

      toast({
        title: translations.dashboard.profile.toasts.updated.title,
        description: translations.dashboard.profile.toasts.updated.description,
      })

      setShowProfileForm(false)
    } catch (error) {
      console.error("Error saving mentor profile:", error)
      toast({
        title: translations.dashboard.profile.toasts.error.title,
        description: translations.dashboard.profile.toasts.error.description,
        variant: "destructive",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleOpenResetModal = () => {
    setShowResetConfirmModal(true)
  }

  const confirmResetSignup = async () => {
    if (!user?.id) return

    setResettingSignup(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      const response = await fetch(`${apiUrl}/users/${user.id}/reset-event-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || (locale === "es" ? "No se pudo reiniciar la inscripción" : "Could not reset signup"))
      }

      toast({
        title: locale === "es" ? "Inscripción reiniciada" : "Signup reset",
        description: locale === "es" ? "Te redirigimos para que vuelvas a elegir la modalidad." : "Redirecting you to choose your registration mode again.",
      })

      router.replace(`/${locale}/auth/event-signup`)
    } catch (error: any) {
      toast({
        title: locale === "es" ? "Error" : "Error",
        description: error?.message || (locale === "es" ? "No se pudo completar la acción" : "Could not complete the action"),
        variant: "destructive",
      })
    } finally {
      setResettingSignup(false)
      setShowResetConfirmModal(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-pixel text-brand-cyan neon-glow-cyan">
            {translations.dashboard.profile.title}
          </h1>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center flex-shrink-0">
                  <span className="font-pixel text-brand-cyan text-lg">
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div>
                  <p className="text-brand-cyan font-semibold">{user?.name} {user?.surname}</p>
                  <p className="text-brand-cyan/60 text-sm">{user?.email}</p>
                </div>
              </div>
              {user?.role === "participant" && (
                <PixelButton onClick={handleOpenResetModal} disabled={resettingSignup} variant="outline" className="whitespace-nowrap">
                  {resettingSignup
                    ? (locale === "es" ? "REINICIANDO..." : "RESETTING...")
                    : (locale === "es" ? "CAMBIAR INSCRIPCIÓN" : "CHANGE REGISTRATION")}
                </PixelButton>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="space-y-4">
              {/* Mentor/Judge Profile Section */}
              {(user?.role === "mentor" || user?.role === "judge") && (
                <>
                  <h2 className="text-brand-yellow font-pixel text-lg mb-4">
                    {user.role === "mentor" ? (locale === "es" ? "Perfil Mentor" : "Mentor Profile") : (locale === "es" ? "Perfil Jurado" : "Judge Profile")}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-brand-cyan text-xs font-pixel">{locale === "es" ? "Nombre" : "Name"} *</Label>
                      <Input
                        value={mentorForm.name}
                        onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                        className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                        disabled={!showProfileForm}
                      />
                    </div>
                    <div>
                      <Label className="text-brand-cyan text-xs font-pixel">{locale === "es" ? "Posición" : "Position"}</Label>
                      <Input
                        value={mentorForm.position}
                        onChange={(e) => setMentorForm({ ...mentorForm, position: e.target.value })}
                        className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                        placeholder="Ej: CTO"
                        disabled={!showProfileForm}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-brand-cyan text-xs font-pixel">{locale === "es" ? "Compañía" : "Company"}</Label>
                    <Input
                      value={mentorForm.company}
                      onChange={(e) => setMentorForm({ ...mentorForm, company: e.target.value })}
                      className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder="Ej: Google"
                      disabled={!showProfileForm}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-brand-cyan text-xs font-pixel">Bio (English)</Label>
                      <Textarea
                        value={mentorForm.englishBio}
                        onChange={(e) => setMentorForm({ ...mentorForm, englishBio: e.target.value })}
                        className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan min-h-20"
                        disabled={!showProfileForm}
                      />
                    </div>
                    <div>
                      <Label className="text-brand-cyan text-xs font-pixel">Bio (Español)</Label>
                      <Textarea
                        value={mentorForm.spanishBio}
                        onChange={(e) => setMentorForm({ ...mentorForm, spanishBio: e.target.value })}
                        className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan min-h-20"
                        disabled={!showProfileForm}
                      />
                    </div>
                  </div>

                  {/* Mentor Categories */}
                  {user?.role === "mentor" && (
                    <div>
                      <Label className="text-brand-cyan text-xs font-pixel mb-2 block">{locale === "es" ? "Categorías" : "Categories"}</Label>
                      <div className="space-y-2 p-3 bg-brand-navy/30 border border-brand-cyan/20 rounded">
                        {(["tech", "entrepreneurship", "oratory"] as const).map((cat) => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer text-xs text-brand-cyan hover:text-brand-yellow transition-colors">
                            <input
                              type="checkbox"
                              checked={mentorForm.categories.includes(cat)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setMentorForm({
                                    ...mentorForm,
                                    categories: [...mentorForm.categories, cat],
                                  })
                                } else {
                                  setMentorForm({
                                    ...mentorForm,
                                    categories: mentorForm.categories.filter((c) => c !== cat),
                                  })
                                }
                              }}
                              disabled={!showProfileForm}
                              className="w-4 h-4 accent-brand-yellow"
                            />
                            <span>
                              {cat === "tech" && "Tech"}
                              {cat === "entrepreneurship" && (locale === "es" ? "Emprendimiento" : "Entrepreneurship")}
                              {cat === "oratory" && (locale === "es" ? "Oratoria" : "Oratory")}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-brand-cyan/20 pt-4 mt-4" />
                </>
              )}

              {/* Social Media */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-brand-cyan text-xs font-pixel flex items-center gap-2">
                    <Github className="w-3 h-3" /> GitHub
                  </Label>
                  <Input
                    value={user?.role === "mentor" || user?.role === "judge" ? mentorForm.github : profileForm.github}
                    onChange={(e) => 
                      user?.role === "mentor" || user?.role === "judge"
                        ? setMentorForm({ ...mentorForm, github: e.target.value })
                        : setProfileForm({ ...profileForm, github: e.target.value })
                    }
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder="https://github.com/username"
                    disabled={!showProfileForm}
                  />
                </div>
                <div>
                  <Label className="text-brand-cyan text-xs font-pixel flex items-center gap-2">
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </Label>
                  <Input
                    value={user?.role === "mentor" || user?.role === "judge" ? mentorForm.linkedin : profileForm.linkedin}
                    onChange={(e) => 
                      user?.role === "mentor" || user?.role === "judge"
                        ? setMentorForm({ ...mentorForm, linkedin: e.target.value })
                        : setProfileForm({ ...profileForm, linkedin: e.target.value })
                    }
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder="https://linkedin.com/in/username"
                    disabled={!showProfileForm}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-brand-cyan text-xs font-pixel flex items-center gap-2">
                    <Instagram className="w-3 h-3" /> Instagram
                  </Label>
                  <Input
                    value={user?.role === "mentor" || user?.role === "judge" ? mentorForm.instagram : profileForm.instagram}
                    onChange={(e) => 
                      user?.role === "mentor" || user?.role === "judge"
                        ? setMentorForm({ ...mentorForm, instagram: e.target.value })
                        : setProfileForm({ ...profileForm, instagram: e.target.value })
                    }
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder="https://instagram.com/username"
                    disabled={!showProfileForm}
                  />
                </div>
                <div>
                  <Label className="text-brand-cyan text-xs font-pixel flex items-center gap-2">
                    <Twitter className="w-3 h-3" /> Twitter
                  </Label>
                  <Input
                    value={user?.role === "mentor" || user?.role === "judge" ? mentorForm.twitter : profileForm.twitter}
                    onChange={(e) => 
                      user?.role === "mentor" || user?.role === "judge"
                        ? setMentorForm({ ...mentorForm, twitter: e.target.value })
                        : setProfileForm({ ...profileForm, twitter: e.target.value })
                    }
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder="https://twitter.com/username"
                    disabled={!showProfileForm}
                  />
                </div>
              </div>

              {/* Participant-only fields */}
              {user?.role === "participant" && (
                <>
                  <div>
                    <Label className="text-brand-cyan text-xs font-pixel flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" /> {translations.dashboard.profile.cvLink}
                    </Label>
                    <Input
                      value={profileForm.link_cv}
                      onChange={(e) => setProfileForm({ ...profileForm, link_cv: e.target.value })}
                      className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder="https://..."
                      disabled={!showProfileForm}
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan text-xs font-pixel flex items-center gap-2">
                      <Utensils className="w-3 h-3" /> {translations.dashboard.profile.foodPreference}
                    </Label>
                    <Input
                      value={profileForm.food_preference}
                      onChange={(e) => setProfileForm({ ...profileForm, food_preference: e.target.value })}
                      className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder={translations.dashboard.profile.foodPlaceholder}
                      disabled={!showProfileForm}
                    />
                  </div>
                </>
              )}

              {!showProfileForm ? (
                <div className="flex justify-end pt-4">
                  <PixelButton onClick={() => setShowProfileForm(true)} className="min-w-[140px] px-4">
                    {translations.dashboard.profile.edit}
                  </PixelButton>
                </div>
              ) : (
                <div className="flex gap-3 justify-end pt-4">
                  <PixelButton 
                    onClick={() => {
                      setShowProfileForm(false)
                      // Resetear valores originales
                      if (user?.role === "mentor" || user?.role === "judge") {
                        // Reset mentor form
                        if (user && db) {
                          const loadMentorData = async () => {
                            try {
                              const collectionName = user.role === "mentor" ? "mentors" : "judges"
                              const snapshot = await getDocs(
                                query(collection(db, collectionName), where("email", "==", user.email))
                              )
                              if (snapshot.docs.length > 0) {
                                const data = snapshot.docs[0].data()
                                setMentorForm({
                                  name: data.name || "",
                                  position: data.position || "",
                                  company: data.company || "",
                                  englishBio: data.englishBio || "",
                                  spanishBio: data.spanishBio || "",
                                  linkedin: data.linkedin || "",
                                  github: data.github || "",
                                  instagram: data.instagram || "",
                                  twitter: data.twitter || "",
                                  categories: (user.role === "mentor" && data.categories) ? data.categories : [],
                                })
                              }
                            } catch (err) {
                              console.error("Error loading mentor data:", err)
                            }
                          }
                          loadMentorData()
                        }
                      } else {
                        setProfileForm({
                          github: user?.github || "",
                          link_cv: user?.link_cv || "",
                          linkedin: user?.linkedin || "",
                          instagram: user?.instagram || "",
                          twitter: user?.twitter || "",
                          food_preference: user?.food_preference || "",
                        })
                      }
                    }} 
                    variant="outline"
                    disabled={savingProfile}
                  >
                    {translations.dashboard.profile.cancel}
                  </PixelButton>
                  <PixelButton
                    onClick={user?.role === "mentor" || user?.role === "judge" ? saveMentorProfile : saveProfile}
                    className="px-6"
                    disabled={savingProfile}
                  >
                    {savingProfile ? translations.dashboard.profile.saving : translations.dashboard.profile.save}
                  </PixelButton>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </DashboardLayout>

      {/* Reset Signup Confirmation Modal */}
      <Dialog open={showResetConfirmModal} onOpenChange={setShowResetConfirmModal}>
        <DialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan max-w-md">
          <DialogHeader>
            <DialogTitle className="font-pixel text-brand-yellow">
              {locale === "es" ? "Cambiar forma de inscripción" : "Change registration mode"}
            </DialogTitle>
            <DialogDescription className="text-brand-cyan/80 text-sm mt-2">
              {locale === "es"
                ? "Esto te hará volver al formulario de inscripción para cambiar la modalidad. Si estás solo en tu equipo, el equipo se eliminará. ¿Querés continuar?"
                : "This will send you back to event signup to change your registration mode. If you are the only member in your team, the team will be deleted. Continue?"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <PixelButton
              onClick={confirmResetSignup}
              disabled={resettingSignup}
              className="flex-1"
            >
              {resettingSignup
                ? (locale === "es" ? "REINICIANDO..." : "RESETTING...")
                : (locale === "es" ? "CONTINUAR" : "CONTINUE")}
            </PixelButton>
            <PixelButton
              onClick={() => setShowResetConfirmModal(false)}
              variant="outline"
              disabled={resettingSignup}
              className="flex-1"
            >
              {locale === "es" ? "CANCELAR" : "CANCEL"}
            </PixelButton>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
