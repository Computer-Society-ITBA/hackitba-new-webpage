"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlassCard } from "@/components/ui/glass-card"
import { collection, getDocs } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import * as LucideIcons from "lucide-react"
import { LoremIpsum } from "lorem-ipsum"

interface CategoriesProps {
  translations: any
}

const lorem = new LoremIpsum()

export function Categories({ translations }: CategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null)
  // const [categories, setCategories] = useState<any[]>([])

  // useEffect(() => {
  //   loadCategories()
  // }, [])

  // const loadCategories = async () => {
  //   const db = getDbClient()
  //   if (!db) {
  //     return
  //   }
  //   const categoriesSnapshot = await getDocs(collection(db, "categories"))
  //   const cats = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  //   cats.sort((a, b) => a.order - b.order)
  //   setCategories(cats)
  // }

  const categories =
    [
      {
        "id": "0",
        "name": "Inteligencia Artificial",
        "details": lorem.generateParagraphs(1),
        "icon": "BrainCircuit",
        "description": ""
      },
      {
        "id": "1",
        "name": "Web3",
        "details": lorem.generateParagraphs(1),
        "icon": "GlobeLock",
        "description": ""
      },
      {
        "id": "2",
        "name": "GameDev",
        "details": lorem.generateParagraphs(1),
        "icon": "Gamepad",
        "description": ""
      }
    ]

  return (
    <section id="categories" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div>
            <p className="font-pixel text-md text-brand-yellow mb-2">GET</p>
            <p className="font-pixel text-lg text-brand-yellow">{translations.categories.endpoint}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {categories.map((category) => {
            const IconComponent = (LucideIcons as any)[category.icon] || LucideIcons.HelpCircle
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className="group cursor-pointer transition-transform hover:scale-105"
              >
                <GlassCard className="h-full text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 flex items-center justify-center">
                      <IconComponent size={48} />
                    </div>
                    <h3 className="font-pixel text-md">{category.name}</h3>
                  </div>
                </GlassCard>
              </button>
            )
          })}
        </div>
      </div>

      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="glass-effect max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-pixel text-md text-brand-yellow">{selectedCategory?.name}</DialogTitle>
          </DialogHeader>

          {selectedCategory && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 flex items-center justify-center neon-glow-cyan">
                  {(() => {
                    const IconComponent = (LucideIcons as any)[selectedCategory.icon] || LucideIcons.HelpCircle
                    return <IconComponent size={64} />
                  })()}
                </div>
              </div>

              <p className="leading-relaxed">{selectedCategory.details}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
