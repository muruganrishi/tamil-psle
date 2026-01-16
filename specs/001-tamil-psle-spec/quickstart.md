# Quickstart: TamilPSLE Exam-Prep App

**Branch**: `001-tamil-psle-spec` | **Date**: 2026-01-16

---

## Prerequisites

Before starting development, ensure you have:

- **Node.js** 18.x or later
- **npm** 9.x or later (or pnpm/yarn)
- **Git** for version control
- **Supabase account** ([supabase.com](https://supabase.com))
- **Google AI Studio account** for Gemini API key ([aistudio.google.com](https://aistudio.google.com))
- **Vercel account** for deployment ([vercel.com](https://vercel.com))

---

## Quick Setup (5 minutes)

### 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization, enter project name (e.g., `tamilpsle-dev`)
4. Select region closest to Singapore (ap-southeast-1)
5. Set a secure database password and save it
6. Wait for project to initialize (~2 minutes)

### 2. Get API Keys

**Supabase:**
- Project Settings → API → Copy:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (server-only!)

**Gemini:**
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create new API key → Copy as `GEMINI_API_KEY`

### 3. Clone and Install

```bash
git clone <repository-url>
cd tamilpsle
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini AI
GEMINI_API_KEY=AIzaSy...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Migrations

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure Overview

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── student/        # Student views
│   │   ├── teacher/        # Teacher views
│   │   └── admin/          # Admin views
│   └── api/                # API route handlers
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Feature components
├── lib/                    # Utilities and clients
│   ├── supabase/           # Supabase client config
│   ├── gemini/             # Gemini API wrapper
│   └── validators/         # Zod schemas
└── types/                  # TypeScript definitions

supabase/
├── migrations/             # SQL migration files
└── seed.sql                # Sample data

tests/
└── e2e/                    # Playwright tests
```

---

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run test` | Run Playwright tests |
| `supabase db push` | Apply migrations to remote |
| `supabase gen types typescript` | Generate TypeScript types |

---

## Development Workflow

### Adding a New Feature

1. **Create branch**: `git checkout -b feat/feature-name`
2. **Plan**: Review relevant spec section in `specs/001-tamil-psle-spec/spec.md`
3. **Implement**: Follow task breakdown in `plan.md`
4. **Validate**: Use Zod schemas from `contracts/`
5. **Test**: Add Playwright test if critical path
6. **Commit**: Use conventional commits (`feat:`, `fix:`, etc.)
7. **PR**: Create PR, link to task, request review

### Database Changes

1. Create migration file: `supabase/migrations/XXX_description.sql`
2. Include RLS policies for new tables
3. Test locally: `supabase db reset`
4. Push to remote: `supabase db push`
5. Regenerate types: `supabase gen types typescript --local > src/types/database.ts`

### API Development

1. Define schema in `specs/001-tamil-psle-spec/contracts/`
2. Create route handler in `src/app/api/`
3. Validate request with Zod schema
4. Check auth with Supabase client
5. Return typed response

---

## Test Accounts (Development)

After running seed script:

| Email | Password | Role |
|-------|----------|------|
| admin@test.com | Test123! | admin |
| teacher@test.com | Test123! | teacher |
| student@test.com | Test123! | student |

---

## Deployment

### Vercel Setup

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (production URL)
3. Deploy main branch

### Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase RLS policies verified
- [ ] Rate limiting enabled
- [ ] Email templates configured in Supabase
- [ ] CORS configured for production domain
- [ ] Playwright smoke tests pass

---

## Troubleshooting

### Common Issues

**"TypeError: Cannot read property 'user' of null"**
- Ensure Supabase client is initialized correctly
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

**"Permission denied" on database operations**
- RLS policies may be blocking access
- Verify user role matches expected permissions
- Check `auth.uid()` is available in policy

**"429 Too Many Requests" on meaning API**
- Rate limit exceeded (60/min per user)
- Wait 1 minute or increase limit for development

**Gemini API errors**
- Verify `GEMINI_API_KEY` is valid
- Check rate limits in Google AI Studio
- Ensure request format matches expected schema

---

## Resources

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/](./contracts/)
- **Research**: [research.md](./research.md)

### External Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Gemini API](https://ai.google.dev/docs)
- [Playwright Testing](https://playwright.dev/)

---

**Quickstart Status**: Complete | **Last Updated**: 2026-01-16
