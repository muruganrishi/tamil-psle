# Tamil PSLE Practice Platform

A full-stack Tamil language exam preparation platform for Singapore Primary 6 (PSLE) students. It covers all six examinable Tamil language sections through MCQ drills, with AI-powered vocabulary lookup, teacher-managed class assignments, spaced repetition for vocabulary review, and an admin dashboard for digitising paper exam materials via OCR — all in a bilingual (English/Tamil) interface.

**Live app:** [tamil-psle.vercel.app](https://tamil-psle.vercel.app)

![Screenshot placeholder](docs/screenshot.png)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ~16.x |
| UI runtime | React | 19.0.0 |
| Language | TypeScript (strict) | 5.7.2 |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.0.0 |
| Component primitives | Radix UI | — |
| Database & Auth | Supabase (PostgreSQL + RLS) | 2.47.10 |
| AI — word meaning | OpenAI GPT-4o-mini | openai ^6.17.0 |
| AI — generation & OCR | Google Gemini 1.5 Flash | @google/generative-ai ^0.21.0 |
| Validation | Zod | 3.24.1 |
| Testing | Playwright (E2E) | 1.49.1 |

---

## Architecture

There is no separate backend server. Next.js API Route Handlers (`/app/api/**`) serve as the backend — all AI calls, role checks, and privileged database operations happen server-side where API keys are never exposed. Supabase SSR middleware validates the JWT cookie on every request to a protected route before any page or handler runs.

### Key Design Decisions

**Row Level Security as the primary permission layer.** All 13 database tables have RLS policies that enforce student/teacher/admin access at the database level. Even if an API route has a bug, the database rejects the unauthorized query — a hard second line of defense.

**Two AI providers, one per task type.** GPT-4o-mini handles constrained word-meaning lookups where precision matters; Gemini 1.5 Flash handles generation tasks (MCQ distractors, OCR) where it performs well at lower cost. Routing by task optimises both quality and spend.

**AI output caching by input hash.** Word meanings and distractor sets are stored in `word_sense_cache` and `ai_generation_cache` tables, keyed by a hash of the inputs. When 30 students click the same word in the same passage, only one API call is made — critical for classroom-scale usage.

**SM-2 spaced repetition for vocabulary review.** The vocabulary bank uses the SM-2 algorithm (the algorithm behind Anki) to schedule word reviews. `ease` factor and `interval_days` are updated per review result (`easy / good / hard / again`), so harder words resurface sooner.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup
│   ├── (dashboard)/     # Practice, vocab, classes, results, admin, teacher
│   └── api/             # All backend route handlers
├── components/          # React components (UI primitives + feature components)
├── hooks/               # useVocabBank, usePracticeSession, useGeminiCached
├── lib/
│   ├── gemini/          # OpenAI + Gemini API wrappers with prompt definitions
│   ├── ai/              # Fallback distractor logic
│   ├── supabase/        # SSR and service-role client factories
│   ├── validators/      # Zod schemas for every API boundary
│   └── rate-limit.ts    # Per-endpoint in-memory rate limiting
└── types/               # TypeScript types and Supabase-generated DB types
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, GEMINI_API_KEY

# Run the development server
npm run dev

# Run tests and lint
npm test && npm run lint
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI key for word meaning lookup |
| `GEMINI_API_KEY` | Google Gemini key for distractor generation and OCR |
