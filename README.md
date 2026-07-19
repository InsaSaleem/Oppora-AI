# Oppora AI

**Discover Opportunities. Build Your Future.**

Oppora AI is an AI-powered platform that helps students discover, track, and manage opportunities — internships, scholarships, hackathons, competitions, research positions, conferences, and jobs — in one place. Students get AI-matched recommendations and resume analysis, mentors guide and give feedback on assigned students, and admins manage users, opportunities, and platform-wide analytics.

Built with **Next.js 16 (App Router)**, **Supabase** (PostgreSQL, Auth, Storage, Row Level Security), and **Google Gemini** for AI features.


https://oppora-ai.vercel.app/
---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Debug / Utility Scripts](#debug--utility-scripts)
- [Security Notice](#security-notice)
- [Known Issues / Roadmap](#known-issues--roadmap)

---

## Features

### Public
- Modern, scrollable landing page with Login / Get Started in the top nav
- Email + password authentication, with password reset (`forgot-password`, `update-password`)
- Role-based redirect after login — Student, Mentor, or Admin land on their own dashboard automatically
- Light / dark theme toggle

### Student Dashboard (`/dashboard`)
- Overview with KPI cards (applications sent, saved opportunities, resume match score, upcoming deadlines)
- Browse opportunities (`/dashboard/opportunities`) with detail pages, save/apply actions
- Saved opportunities (`/dashboard/saved`)
- Application tracker (`/dashboard/applications`)
- AI-powered recommendations (`/dashboard/recommendations`)
- Resume upload + AI analysis (`/dashboard/resume`)
- Browse and request mentors (`/dashboard/mentors`)
- Notifications (`/dashboard/notifications`)
- Profile settings (`/dashboard/settings`)

### Mentor Dashboard (`/mentor`)
- Overview of assigned students
- Incoming mentorship requests — accept/decline (`/mentor/requests`)
- Student list (`/mentor/students`)
- View student applications (`/mentor/applications`)
- Give feedback to students (`/mentor/feedback`)
- Profile settings (`/mentor/settings`)

### Admin Dashboard (`/admin`)
- Platform overview
- User management (`/admin/users`)
- Mentor / opportunity approvals (`/admin/approvals`)
- Opportunity management (`/admin/opportunities`)
- Admin settings (`/admin/settings`)

### AI Features (Google Gemini)
- `POST /api/analyze-resume` — extracts skills and generates a resume match score
- `POST /api/recommendations` — generates AI-ranked opportunity recommendations per student

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| Icons | lucide-react |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage, Row Level Security) |
| AI | Google Generative AI (Gemini) |
| Payments | Stripe |
| Email | Resend |

---

## Project Structure

```
Oppora-AI/
├── src/
│   ├── app/
│   │   ├── (auth)/              # login, register, forgot-password, update-password
│   │   ├── (student)/dashboard/ # student area: opportunities, saved, applications,
│   │   │                        # recommendations, resume, mentors, notifications, settings
│   │   ├── (mentor)/mentor/     # mentor area: requests, students, applications, feedback, settings
│   │   ├── (admin)/admin/       # admin area: users, approvals, opportunities, settings
│   │   ├── api/
│   │   │   ├── analyze-resume/  # Gemini-powered resume analysis
│   │   │   └── recommendations/ # Gemini-powered opportunity matching
│   │   ├── auth/callback/       # OAuth / email verification callback
│   │   ├── layout.tsx
│   │   ├── page.tsx             # landing page
│   │   └── globals.css          # design tokens (light/dark theme)
│   ├── components/
│   │   ├── landing/             # nav, hero, features, how-it-works, testimonials, FAQ, footer
│   │   ├── layout/               # sidebar, topnav, dashboard shell
│   │   ├── theme/                # ThemeToggle
│   │   └── dashboard/            # KPI cards, cards, forms, tables shared across roles
│   ├── lib/
│   │   ├── supabase/             # browser client, server client, proxy/session helper
│   │   ├── mentor.ts             # resolves auth user id -> mentors.id (see Known Issues)
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts           # shared TypeScript types
│   └── proxy.ts                  # route protection (Next 16 renamed middleware.ts -> proxy.ts)
├── public/                       # static assets
├── checkApps.ts                  # debug script
├── checkMentors.ts                # debug script
├── checkSaved.ts                  # debug script
├── checkTables.ts                 # debug script — lists real tables in the DB
├── listModels.ts                  # debug script — lists available Gemini models for your API key
├── package.json
└── ...config files (tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs)
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| [Node.js](https://nodejs.org/) | v20 or later |
| npm | Bundled with Node.js |
| [Supabase account](https://supabase.com/) | Free tier is sufficient for development |
| [Google AI Studio API key](https://aistudio.google.com/) | For Gemini-powered features |
| Git | For cloning the repository |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/<your-org>/Oppora-AI.git
cd Oppora-AI

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Environment Variables

Create a `.env.local` file in the project root (copy `.env.example` as a starting point):

```env
# Supabase — Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini — required for /api/analyze-resume and /api/recommendations
GEMINI_API_KEY=your-gemini-api-key

# Stripe — required once billing is wired up
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Resend — required for transactional/notification emails
RESEND_API_KEY=your-resend-api-key
```

**Where to find these:**
- **Supabase URL / anon key** — Supabase Dashboard → your project → Project Settings → API. Use the **anon / public** key, never `service_role`, in `NEXT_PUBLIC_*` variables.
- **Gemini API key** — [Google AI Studio](https://aistudio.google.com/) → Get API key.
- **Stripe keys** — Stripe Dashboard → Developers → API keys.
- **Resend key** — Resend Dashboard → API Keys.

---

## Database Setup

This project uses Supabase Postgres with Row Level Security enabled on every table. At minimum you'll need:

- Core tables: `users`, `profiles`, `mentors`, `mentor_students`, `opportunities`, `applications`, `saved_opportunities`, `ai_recommendations`, `ai_resume_analysis`, `mentor_feedback`, `notifications`, `activity_logs`, `payments`
- `mentorship_requests` — the request/accept flow for a student requesting a mentor

Run `checkTables.ts` against your own project (with `.env.local` populated) to confirm exactly which tables currently exist in your database before making schema changes:

```bash
npx tsx checkTables.ts
```

RLS policies should scope each table so students/mentors can only read and write their own data, with admins granted broader access. See `src/lib/mentor.ts` for an important caveat on mentor ID resolution before writing any query against mentor tables.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the local development server |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Runs the production build locally (run `build` first) |
| `npm run lint` | Runs ESLint |

---

## Debug / Utility Scripts

These are standalone TypeScript scripts (not part of the Next.js app) for inspecting your Supabase/Gemini setup directly. Run with `npx tsx <file>` after your `.env.local` is populated:

| Script | Purpose |
|---|---|
| `checkTables.ts` | Lists tables that actually exist in your Supabase database |
| `checkMentors.ts` | Inspects mentor-related data/records |
| `checkSaved.ts` | Inspects saved-opportunity records |
| `checkApps.ts` | Inspects application records |
| `listModels.ts` | Lists Gemini models available to your `GEMINI_API_KEY` — use this to confirm the exact model name before hardcoding it in `/api/analyze-resume` or `/api/recommendations` |

---

## Security Notice

> ⚠️ **Never commit `.env.local` to GitHub.** It contains live credentials for Supabase, Gemini, Stripe, and Resend.
>
> - `.env.local` is already covered by `.gitignore` (`.env*`) — do not remove that entry.
> - Use `.env.example` (committed, values left blank) as the template for what variables are required.
> - Only the `NEXT_PUBLIC_*` Supabase variables are safe to expose to the browser. Every other key (`GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, and the Supabase `service_role` key if you ever use one) must stay server-side only — never prefix them with `NEXT_PUBLIC_`, never reference them in client components.

---

## Known Issues / Roadmap

- **`mentorship_requests.mentor_id` foreign key** currently points to `users.id`, while `mentor_students` and `mentor_feedback` correctly point to `mentors.id`. `src/lib/mentor.ts` documents and works around this, but the underlying FK should be migrated to reference `mentors.id` directly for consistency and to guarantee requests can only target approved mentors.
- Admin analytics dashboards (charts for application status, activity logs, mentorship progress) are not yet implemented — Recharts is installed and ready.
- Stripe billing/subscription flow is scaffolded (schema + dependency installed) but not yet wired up end-to-end.
- Full opportunity CRUD (admin create/edit forms) is partially implemented — see `/admin/opportunities`.
