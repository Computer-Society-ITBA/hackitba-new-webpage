# HackITBA 2026 

An event management platform built with Next.js 16, TypeScript, Tailwind CSS, and Firebase.

## Features

### Landing Page
- Hero section with typing effects and neon glows
- Animated stats counters
- Interactive timeline
- Sponsors carousel
- Mentors and judges grid with modals
- Categories with modals
- FAQ accordion
- Countdown timer
- Internationalization (English/Spanish)

### Authentication
- Firebase Auth with email/password
- Role-based access control (Admin, Jurado, Participante)
- Protected routes
- User session management

### Admin Dashboard
- Create and manage events
- Manage sponsors and speakers
- View all participants and teams
- CRUD operations for all resources

### Jurado (Judge) Dashboard
- View assigned projects
- Score projects using detailed rubric (Innovation, Technical, Design, Presentation, Impact)
- Add comments and feedback
- Edit and delete scores

### Participante (Participant) Dashboard
- Complete onboarding flow
- Submit project details (title, description, repo URL, demo URL)
- Edit or delete projects before deadline
- Track submission status

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Deployment**: Vercel
- **Cron Jobs**: Vercel Cron

## Environment Variables

### Local Development

1. Fill in your Firebase configuration values in `.env.local`

2. Verify your configuration:
```bash
npm run check-env
```

## Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Verify environment variables
npm run check-env

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                    # Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx         # Login page
│   │   │   └── signup/page.tsx        # Signup page
│   │   └── dashboard/
│   │       ├── admin/page.tsx         # Admin dashboard
│   │       ├── jurado/page.tsx        # Judge dashboard
│   │       └── participante/page.tsx  # Participant dashboard
│   ├── tokens.css                     # Design tokens
│   └── globals.css                    # Global styles
├── components/
│   ├── auth/                          # Auth components
│   ├── dashboard/                     # Dashboard components
│   ├── effects/                       # Visual effects
│   ├── sections/                      # Landing page sections
│   └── ui/                            # Reusable UI components
├── lib/
│   ├── firebase/                      # Firebase configuration
│   ├── i18n/                          # Internationalization
│   └── email/                         # Email templates
├── public/
│   └── images/                        # Static images
└── proxy.ts                           # Middleware for i18n
```

## Design System

### Colors
- **Navy**: #14192D (Background)
- **Cyan**: #AFEFF3 (Primary text)
- **Orange**: #EF802F (Primary CTA)
- **Dark Orange**: #CF5D0A (Hover states)
- **Yellow**: #FAD399 (Accents)

### Typography
- **Headings**: Pixelar (Pixel font)
- **Body**: Montserrat (Sans-serif)

### Effects
- Neon glow effects (cyan, orange, yellow)
- Neon flicker animation
- Typing effects (horizontal/vertical)
- Glass morphism cards
- Floating animations

## Firebase Collections

### users
```typescript
{
  id: string
  email: string
  role: "admin" | "jurado" | "participante"
  onboardingStep: number
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
```

### events
```typescript
{
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  location: string
  status: "draft" | "published" | "active" | "completed"
  createdAt: Date
  updatedAt: Date
}
```

### projects
```typescript
{
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
```

### scores
```typescript
{
  id: string
  projectId: string
  juradoId: string
  criteria: {
    innovation: number
    technical: number
    design: number
    presentation: number
    impact: number
  }
  totalScore: number
  comments?: string
  createdAt: Date
  updatedAt: Date
}
```
## License

MIT
