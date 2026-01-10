// Mock Firebase Admin SDK for development without credentials

interface MockUser {
  uid: string
  email: string
  emailVerified: boolean
  displayName?: string
  photoURL?: string
  disabled: boolean
}

interface MockDocumentSnapshot {
  id: string
  exists: boolean
  data: () => any
  ref: any
}

interface MockQuerySnapshot {
  docs: MockDocumentSnapshot[]
  empty: boolean
  size: number
}

// In-memory data store for mock
const mockUsers: Map<string, MockUser> = new Map()
const mockCollections: Map<string, Map<string, any>> = new Map()

// Initialize with some sample data
function initMockData() {
  if (!mockCollections.has("categories")) {
    const categories = new Map()
    categories.set("web3", {
      id: "web3",
      name: "Web3",
      description: "Blockchain and decentralized applications",
      icon: "globe",
      createdAt: new Date().toISOString(),
    })
    categories.set("ai", {
      id: "ai",
      name: "AI",
      description: "Artificial Intelligence and Machine Learning",
      icon: "sparkles",
      createdAt: new Date().toISOString(),
    })
    categories.set("gamedev", {
      id: "gamedev",
      name: "GameDev",
      description: "Game development and interactive experiences",
      icon: "gamepad",
      createdAt: new Date().toISOString(),
    })
    mockCollections.set("categories", categories)
  }

  if (!mockCollections.has("sponsors")) {
    const sponsors = new Map()
    sponsors.set("sponsor1", {
      id: "sponsor1",
      name: "Google",
      logo: "/sponsors/google.png",
      tier: "platinum",
      website: "https://google.com",
      createdAt: new Date().toISOString(),
    })
    sponsors.set("sponsor2", {
      id: "sponsor2",
      name: "Microsoft",
      logo: "/sponsors/microsoft.png",
      tier: "gold",
      website: "https://microsoft.com",
      createdAt: new Date().toISOString(),
    })
    mockCollections.set("sponsors", sponsors)
  }

  if (!mockCollections.has("mentors")) {
    const mentors = new Map()
    mentors.set("mentor1", {
      id: "mentor1",
      name: "Melissa Pinero",
      role: "IT Manager",
      company: "IDL Inversiones",
      bio: "Experienced tech leader with a passion for mentoring",
      photo: "/mentors/placeholder.jpg",
      linkedin: "https://linkedin.com",
      github: "https://github.com",
      createdAt: new Date().toISOString(),
    })
    mockCollections.set("mentors", mentors)
  }

  if (!mockCollections.has("scoring_criteria")) {
    const criteria = new Map()
    criteria.set("criteria1", {
      id: "criteria1",
      name: "Innovation",
      description: "How innovative and creative is the solution?",
      maxScore: 10,
      order: 1,
    })
    criteria.set("criteria2", {
      id: "criteria2",
      name: "Technical Execution",
      description: "Quality of code and technical implementation",
      maxScore: 10,
      order: 2,
    })
    criteria.set("criteria3", {
      id: "criteria3",
      name: "Design",
      description: "User interface and user experience",
      maxScore: 10,
      order: 3,
    })
    criteria.set("criteria4", {
      id: "criteria4",
      name: "Presentation",
      description: "Quality of pitch and demo",
      maxScore: 10,
      order: 4,
    })
    mockCollections.set("scoring_criteria", criteria)
  }

  if (!mockCollections.has("settings")) {
    const settings = new Map()
    settings.set("global", {
      id: "global",
      submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      eventDate: "2026-03-27",
      eventLocation: "Parque Patricios, CABA",
      maxTeamSize: 4,
      updatedAt: new Date().toISOString(),
    })
    mockCollections.set("settings", settings)
  }
}

initMockData()

// Mock Auth
export const mockAuth = () => ({
  getUser: async (uid: string): Promise<MockUser> => {
    const user = mockUsers.get(uid)
    if (!user) {
      throw new Error("User not found")
    }
    return user
  },
  createUser: async (properties: any): Promise<MockUser> => {
    const uid = `mock-uid-${Date.now()}`
    const user: MockUser = {
      uid,
      email: properties.email,
      emailVerified: false,
      displayName: properties.displayName,
      disabled: false,
    }
    mockUsers.set(uid, user)
    return user
  },
  updateUser: async (uid: string, properties: any): Promise<MockUser> => {
    const user = mockUsers.get(uid)
    if (!user) {
      throw new Error("User not found")
    }
    Object.assign(user, properties)
    return user
  },
  deleteUser: async (uid: string): Promise<void> => {
    mockUsers.delete(uid)
  },
})

// Mock Firestore
export const mockDb = () => ({
  collection: (name: string) => ({
    doc: (id?: string) => ({
      get: async () => {
        const collection = mockCollections.get(name) || new Map()
        if (!id) {
          return {
            exists: false,
            data: () => undefined,
          }
        }
        const data = collection.get(id)
        return {
          id,
          exists: !!data,
          data: () => data,
          ref: { id },
        }
      },
      set: async (data: any) => {
        let collection = mockCollections.get(name)
        if (!collection) {
          collection = new Map()
          mockCollections.set(name, collection)
        }
        const docId = id || `mock-id-${Date.now()}`
        collection.set(docId, { id: docId, ...data })
        console.log(`[v0 Mock] Set document ${name}/${docId}`)
      },
      update: async (data: any) => {
        const collection = mockCollections.get(name)
        if (!collection || !id) {
          throw new Error("Document not found")
        }
        const existing = collection.get(id)
        if (!existing) {
          throw new Error("Document not found")
        }
        collection.set(id, { ...existing, ...data })
        console.log(`[v0 Mock] Updated document ${name}/${id}`)
      },
      delete: async () => {
        const collection = mockCollections.get(name)
        if (collection && id) {
          collection.delete(id)
          console.log(`[v0 Mock] Deleted document ${name}/${id}`)
        }
      },
    }),
    get: async () => {
      const collection = mockCollections.get(name) || new Map()
      const docs = Array.from(collection.values()).map((data) => ({
        id: data.id,
        exists: true,
        data: () => data,
        ref: { id: data.id },
      }))
      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
      }
    },
    where: (field: string, op: string, value: any) => ({
      get: async () => {
        const collection = mockCollections.get(name) || new Map()
        const docs = Array.from(collection.values())
          .filter((data) => {
            if (op === "==") return data[field] === value
            if (op === "!=") return data[field] !== value
            if (op === ">") return data[field] > value
            if (op === "<") return data[field] < value
            if (op === ">=") return data[field] >= value
            if (op === "<=") return data[field] <= value
            return false
          })
          .map((data) => ({
            id: data.id,
            exists: true,
            data: () => data,
            ref: { id: data.id },
          }))
        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
        }
      },
    }),
    add: async (data: any) => {
      let collection = mockCollections.get(name)
      if (!collection) {
        collection = new Map()
        mockCollections.set(name, collection)
      }
      const docId = `mock-id-${Date.now()}`
      collection.set(docId, { id: docId, ...data })
      console.log(`[v0 Mock] Added document ${name}/${docId}`)
      return { id: docId }
    },
  }),
})

// Mock Storage
export const mockStorage = () => ({
  bucket: () => ({
    file: (path: string) => ({
      save: async (buffer: Buffer) => {
        console.log(`[v0 Mock] Saved file to ${path}`)
        return Promise.resolve()
      },
      download: async () => {
        console.log(`[v0 Mock] Downloaded file from ${path}`)
        return [Buffer.from("mock file content")]
      },
      delete: async () => {
        console.log(`[v0 Mock] Deleted file ${path}`)
        return Promise.resolve()
      },
      getSignedUrl: async () => {
        return [`https://mock-storage.example.com/${path}`]
      },
    }),
  }),
})
