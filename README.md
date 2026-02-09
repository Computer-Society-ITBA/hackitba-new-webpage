# HackITBA 2026 - Event Management Platform

A production-ready event management platform built with Next.js 16, TypeScript, Tailwind CSS, and Firebase.

## Features

### Landing Page
- Hero section with typing effects and neon glows
- Animated stats counters
- Interactive timeline
- Sponsors carousel
- Mentors grid with modals
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

### Automation (Vercel Cron Jobs)
- Daily onboarding reminders for incomplete profiles
- Automatic event closure on deadline
- Submission deadline enforcement
- Email notifications

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

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Fill in your Firebase configuration values in `.env.local`

3. Verify your configuration:
```bash
npm run check-env
```

### Production Deployment (Vercel)

For detailed instructions on configuring environment variables for production deployment, see [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md).

Quick steps:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add all variables from `.env.example`
4. Redeploy your application

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
│   ├── api/
│   │   └── cron/                      # Cron job endpoints
│   ├── fonts/                         # Custom fonts
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
├── vercel.json                        # Vercel configuration
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

## Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

Vercel will automatically:
- Build the Next.js app
- Set up cron jobs from `vercel.json`
- Configure edge functions
- Enable analytics

## Cron Jobs

See [docs/CRON_JOBS.md](docs/CRON_JOBS.md) for detailed documentation.

## Assumptions Made

1. **Authentication**: Email/password only (no OAuth)
2. **Teams**: Each participant is treated as an individual team (teamId = userId)
3. **Categories**: Hardcoded categories (Web3, IA, GameDev) with manual categoryId assignment
4. **Email**: Email sending is mocked in development, requires provider integration for production
5. **File Uploads**: Firebase Storage is configured but upload UI is not implemented (can be added)
6. **Deadline**: Event deadline based on event.endDate field
7. **Scoring**: Average of 5 criteria (innovation, technical, design, presentation, impact) on 0-10 scale
8. **Onboarding**: 3-step process for participants (profile completion)
9. **Language**: Default locale is Spanish, supports English
10. **Timezone**: All cron jobs run in UTC

## License

MIT
