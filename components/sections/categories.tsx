"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlassCard } from "@/components/ui/glass-card"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/client-config"
import * as LucideIcons from "lucide-react"

interface CategoriesProps {
  translations: any
}

export function Categories({ translations }: CategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const categoriesSnapshot = await getDocs(collection(db, "categories"))
    const cats = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    cats.sort((a, b) => a.order - b.order)
    setCategories(cats)
  }

  return (
    <section id="categories" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-brand-cyan mb-2">{translations.categories.endpoint}</p>
          <h2 className="font-pixel text-3xl md:text-5xl text-brand-orange neon-glow-orange">
            {translations.categories.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {categories.map((category) => {
            const IconComponent = (LucideIcons as any)[category.icon] || LucideIcons.HelpCircle
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className="group cursor-pointer transition-transform hover:scale-105"
              >
                <GlassCard neonOnHover neonColor="cyan" className="h-full text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 flex items-center justify-center text-brand-cyan">
                      <IconComponent size={48} />
                    </div>
                    <h3 className="font-pixel text-2xl text-brand-yellow">{category.name}</h3>
                    <p className="text-brand-cyan/80 text-sm">{category.description}</p>
                  </div>
                </GlassCard>
              </button>
            )
          })}
        </div>
      </div>

      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="glass-effect border-brand-cyan/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-pixel text-2xl text-brand-orange">{selectedCategory?.name}</DialogTitle>
          </DialogHeader>

          {selectedCategory && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 flex items-center justify-center text-brand-cyan neon-glow-cyan">
                  {(() => {
                    const IconComponent = (LucideIcons as any)[selectedCategory.icon] || LucideIcons.HelpCircle
                    return <IconComponent size={64} />
                  })()}
                </div>
              </div>

              <p className="text-brand-cyan leading-relaxed text-center">{selectedCategory.details}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
