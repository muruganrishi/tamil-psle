# TamilPSLE Constitution

## Core Principles

### I. Privacy-First (NON-NEGOTIABLE)
- All user content is private-by-default; no public redistribution of copyrighted exam papers
- Never log tokens, private uploads, or personally identifying student data (name, email, attempt details)
- Student practice data visible only to: the student, their assigned teacher(s), and system admins
- File uploads (OCR images) are ephemeral or access-controlled; never publicly accessible

### II. Security by Default (NON-NEGOTIABLE)
- Supabase RLS policies on **every** table containing user, class, or attempt data—no exceptions
- All Gemini/external API keys are server-side only; never bundled in client code or exposed via API responses
- Rate limiting and per-user quotas enforced on all AI endpoints (hover meaning, OCR assist)
- Authentication required for all data-mutating operations; role-based access (student, teacher, admin)

### III. Code Quality Standards
- TypeScript `strict` mode enabled; no `any` types without explicit justification
- Zod schemas for all API request/response validation and form inputs
- ESLint + Prettier enforced; CI blocks merges on lint failures
- Small, focused PRs (< 400 lines preferred); conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- No dead code, commented-out blocks, or unused dependencies in main branch

### IV. Testing Requirements
- Playwright smoke tests required for critical paths before MVP ship:
  - Login/logout flow
  - Student practice session (start → answer → submit)
  - Hover/tap word meaning lookup
  - Class join (student)
  - Assignment completion (student)
- New features must include at least one happy-path test
- CI must pass all tests before merge to main

### V. Simplicity & MVP Focus
- YAGNI: Build only what's in-scope for the 1-week MVP; defer nice-to-haves
- Start simple; optimize only when measured bottlenecks appear
- Prefer established patterns (App Router conventions, shadcn/ui components) over custom abstractions
- Every feature must trace back to an in-scope MVP requirement

## Security & Privacy Requirements

### Data Classification
| Classification | Examples | Storage Rules |
|---------------|----------|---------------|
| Public | Question categories, app UI text | No restrictions |
| Internal | Question content, answer options | RLS: authenticated users only |
| Confidential | Student attempts, scores, class rosters | RLS: owner + assigned teacher + admin |
| Restricted | API keys, tokens, uploaded images | Server-only; never logged; ephemeral storage |

### API Security
- All `/api/*` routes validate session via Supabase Auth
- AI endpoints (`/api/meaning`, `/api/ocr`) enforce:
  - Authentication required
  - Rate limit: 60 requests/min per user (meaning), 10 requests/min per user (OCR)
  - Request size limits: 5MB max for image uploads
- CORS configured for production domain only

### Logging Policy
- **ALLOWED**: Request IDs, timestamps, endpoint names, response status codes, anonymized metrics
- **FORBIDDEN**: Auth tokens, API keys, student names/emails, uploaded file contents, raw question text with PII

## Development Workflow

### Definition of Done Checklist
A feature is "Done" when:
- [ ] Code compiles with zero TypeScript errors
- [ ] All Zod schemas validate inputs/outputs
- [ ] Lint and format checks pass
- [ ] RLS policies added/updated for any new tables
- [ ] At least one Playwright test covers the happy path
- [ ] No secrets or API keys in client-facing code
- [ ] PR description links to requirement/task
- [ ] Code reviewed and approved by at least one team member
- [ ] Deployed to preview environment and manually verified

### Branch & Commit Strategy
- `main` branch is protected; direct pushes blocked
- Feature branches: `feat/<short-description>`
- Commit format: `type(scope): description` (e.g., `feat(practice): add vetrumai question type`)
- Squash merge to main; keep commit history clean

### Tech Stack (Locked for MVP)
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | TypeScript strict |
| UI | shadcn/ui + Tailwind | Consistent component library |
| Auth & DB | Supabase (Auth + Postgres + Storage) | RLS mandatory |
| AI | Gemini 2.0 Flash API | Server-side only |
| Testing | Playwright | E2E smoke tests |
| Hosting | Vercel | Preview + Production |

## Governance

- This Constitution supersedes all informal practices and ad-hoc decisions
- All PRs must verify compliance with Core Principles before approval
- Amendments require: documented rationale, team review, and migration plan for affected code
- Complexity beyond MVP scope must be justified in writing and approved
- Security/privacy violations are blocking issues; no exceptions for deadlines

**Version**: 1.0.0 | **Ratified**: 2026-01-16 | **Last Amended**: 2026-01-16
