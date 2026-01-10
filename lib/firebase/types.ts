export type UserRole = "admin" | "jurado" | "participante"

export interface User {
  id: string
  email: string
  role: UserRole
  onboardingStep: number
  teamId?: string
  profile: {
    name: string
    bio?: string
    avatar?: string
    company?: string
    linkedin?: string
    github?: string
    twitter?: string
  }
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
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
