"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useParams } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { useAuth } from "@/lib/firebase/auth-context"
import { getDbClient } from "@/lib/firebase/client-config"
import { doc, updateDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Github, Linkedin, Instagram, Twitter, ExternalLink, Utensils } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"

export default function ProfilePage() {
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)
  const { user } = useAuth()
  const db = getDbClient()

  const [profileForm, setProfileForm] = useState({
    github: "",
    link_cv: "",
    linkedin: "",
    instagram: "",
    twitter: "",
    food_preference: "",
  })

  const [showProfileForm, setShowProfileForm] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

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
    }
  }, [user])

  const saveProfile = async () => {
    if (!db || !user) return

    setSavingProfile(true)
    try {
      await updateDoc(doc(db, "users", user.id), {
        ...profileForm,
        updatedAt: new Date(),
      })

      const { dismiss } = toast({
        title: translations.dashboard.profile.toasts.updated.title,
        description: translations.dashboard.profile.toasts.updated.description,
      })
      setTimeout(dismiss, 3000)
      setShowProfileForm(false)
    } catch (error) {
      const { dismiss } = toast({
        title: translations.dashboard.profile.toasts.error.title,
        description: translations.dashboard.profile.toasts.error.description,
        variant: "destructive",
      })
      setTimeout(dismiss, 4000)
    } finally {
      setSavingProfile(false)
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
          </GlassCard>

          <GlassCard>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-brand-cyan text-xs font-pixel flex items-center gap-2">
                    <Github className="w-3 h-3" /> GitHub
                  </Label>
                  <Input
                    value={profileForm.github}
                    onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
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
                    value={profileForm.linkedin}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
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
                    value={profileForm.instagram}
                    onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
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
                    value={profileForm.twitter}
                    onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })}
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder="https://twitter.com/username"
                    disabled={!showProfileForm}
                  />
                </div>
              </div>

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
                      setProfileForm({
                        github: user?.github || "",
                        link_cv: user?.link_cv || "",
                        linkedin: user?.linkedin || "",
                        instagram: user?.instagram || "",
                        twitter: user?.twitter || "",
                        food_preference: user?.food_preference || "",
                      })
                    }} 
                    variant="outline"
                    disabled={savingProfile}
                  >
                    {translations.dashboard.profile.cancel}
                  </PixelButton>
                  <PixelButton
                    onClick={saveProfile}
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
    </ProtectedRoute>
  )
}
