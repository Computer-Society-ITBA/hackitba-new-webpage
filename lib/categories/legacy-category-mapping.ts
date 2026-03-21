export type CategoryLike = {
  id?: string
  name?: string
  englishName?: string
  spanishName?: string
  iconName?: string
}

type LegacyCategoryKey = "fintech" | "ai" | "marketing"

const LEGACY_KEY_BY_INDEX: LegacyCategoryKey[] = ["fintech", "ai", "marketing"]

const normalize = (value: unknown): string => {
  if (value === null || value === undefined) return ""
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

const detectLegacyKey = (category: CategoryLike): LegacyCategoryKey | null => {
  const text = normalize([
    category.englishName,
    category.spanishName,
    category.name,
    category.iconName,
  ].filter(Boolean).join(" "))

  if (text.includes("fintech") || text.includes("finance") || text.includes("finanzas") || text.includes("wallet")) {
    return "fintech"
  }

  if (text.includes("marketing")) {
    return "marketing"
  }

  if (text.includes(" ai ") || text.startsWith("ai") || text.includes("ia") || text.includes("automat") || text.includes("brain")) {
    return "ai"
  }

  return null
}

const buildLegacyCategoryIdMap = (categories: CategoryLike[]): Record<LegacyCategoryKey, string | null> => {
  const map: Record<LegacyCategoryKey, string | null> = {
    fintech: null,
    ai: null,
    marketing: null,
  }

  for (const category of categories) {
    const id = category.id ? String(category.id) : ""
    if (!id) continue

    const key = detectLegacyKey(category)
    if (key && !map[key]) {
      map[key] = id
    }
  }

  return map
}

const parseLegacyIndex = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const numeric = typeof value === "number" ? value : Number.parseInt(String(value), 10)
  return Number.isNaN(numeric) ? null : numeric
}

export const sortCategoriesByLegacyIndex = <T extends CategoryLike>(categories: T[]): T[] => {
  const idMap = buildLegacyCategoryIdMap(categories)
  const rankById: Record<string, number> = {}

  LEGACY_KEY_BY_INDEX.forEach((key, index) => {
    const id = idMap[key]
    if (id) rankById[id] = index
  })

  return [...categories].sort((a, b) => {
    const rankA = rankById[String(a.id ?? "")] ?? Number.MAX_SAFE_INTEGER
    const rankB = rankById[String(b.id ?? "")] ?? Number.MAX_SAFE_INTEGER
    if (rankA !== rankB) return rankA - rankB
    return String(a.id ?? "").localeCompare(String(b.id ?? ""))
  })
}

export const getCategoryByLegacyIndex = <T extends CategoryLike>(categories: T[], legacyIndex: unknown): T | undefined => {
  const index = parseLegacyIndex(legacyIndex)
  if (index === null || index < 0 || index >= LEGACY_KEY_BY_INDEX.length) return undefined

  const idMap = buildLegacyCategoryIdMap(categories)
  const key = LEGACY_KEY_BY_INDEX[index]
  const targetId = idMap[key]

  if (!targetId) return undefined
  return categories.find((category) => String(category.id) === targetId)
}

export const getLegacyIndexFromCategoryId = (categories: CategoryLike[], categoryId: unknown): number | null => {
  if (categoryId === null || categoryId === undefined || categoryId === "") return null
  const targetId = String(categoryId)
  const targetCategory = categories.find((category) => String(category.id) === targetId)
  if (!targetCategory) return null

  const key = detectLegacyKey(targetCategory)
  if (!key) return null

  return LEGACY_KEY_BY_INDEX.indexOf(key)
}
