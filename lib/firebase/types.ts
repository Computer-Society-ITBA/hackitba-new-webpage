export type UserRole = "admin" | "judge" | "participant" | "mentor"

export interface User {
  id: string
  email: string
  name: string
  surname?: string
  role: UserRole
  onboardingStep?: number
  teamId?: string
  dni?: string
  university?: string
  career?: string
  age?: number
  github?: string
  linkedin?: string
  instagram?: string
  twitter?: string
  link_cv?: string
  food_preference?: string
  category_1?: number
  category_2?: number
  category_3?: number
  team?: string | null
  hasTeam?: boolean // true if participant has a team, false if without team, undefined if not applicable
  company?: string
  position?: string
  photo?: string
  profile?: {
    name?: string
    bio?: string
    avatar?: string
    company?: string
    linkedin?: string
    github?: string
    twitter?: string
  }
  createdAt?: Date
  updatedAt?: Date
  emailVerified?: boolean
}

export interface Event {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  submissionDeadline: Date
  location: string
  status: "draft" | "published" | "active" | "completed"
  createdAt: Date
  updatedAt: Date
}

export interface Sponsor {
  id: string
  name: string
  logo: string
  website: string
  tier: "platinum" | "gold" | "silver" | "bronze"
  order: number
  createdAt: Date
}

export interface Speaker {
  id: string
  name: string
  title: string
  company: string
  bio: string
  avatar: string
  linkedin?: string
  twitter?: string
  github?: string
  email?: string
  order: number
  createdAt: Date
}

export interface Team {
  id: string
  name: string
  participantIds: string[] // 1-4 participants
  eventId: string
  project?: TeamProject
  createdAt: Date
  updatedAt: Date
}

export interface TeamProject {
  title: string
  description: string
  repoUrl: string
  demoUrl?: string
  images: string[]
  videoUrl?: string
  submittedAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description: string
  icon: string
  details: string
  order: number
  createdAt: Date
}

export interface Project {
  id: string
  teamId: string
  categoryId: string
  title: string
  description: string
  repoUrl: string
  demoUrl?: string
  images: string[]
  videoUrl?: string
  submittedAt: Date
  updatedAt: Date
}

export interface ScoringCriteria {
  id: string
  name: string
  description: string
  maxScore: number
  order: number
  createdAt: Date
}

export interface Score {
  id: string
  projectId: string
  juradoId: string
  criteria: { [key: string]: number }
  totalScore: number
  comments?: string
  createdAt: Date
  updatedAt: Date
}

export interface Article {
  id: string
  title: string
  content: string
  author: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}
