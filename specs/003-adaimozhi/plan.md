# Implementation Plan: Adaimozhi (அடைமொழி / Epithets & Compound Phrases)

**Branch**: `003-adaimozhi` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-adaimozhi/spec.md`

## Summary

Implement fill-in-blank Tamil epithet/compound phrase practice for PSLE Section A3 (adaimozhi_echcham). Students complete phrases by selecting the correct missing word from 4 MCQ options, with distractors dynamically sourced from other database entries. Teachers can add content via CSV import, manual form, or AI-assisted generation. The feature integrates into the existing adaimozhi_echcham section alongside other question types.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 14+ (App Router), React 18, shadcn/ui, Tailwind CSS, Zod, @supabase/supabase-js, @google/generative-ai
**Storage**: Supabase PostgreSQL with RLS
**Testing**: Playwright E2E
**Target Platform**: Web (Vercel hosting), mobile-responsive
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Question load <2s, CSV import 50 rows <10s, word meaning <2s
**Constraints**: Cannot modify read-only shared infrastructure paths
**Scale/Scope**: MVP scope, <100 concurrent users initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Privacy-First** | ✅ PASS | Student data private by default; no public content exposure |
| **II. Security by Default** | ✅ PASS | RLS on adaimozhi table; rate limiting on AI endpoints; server-side keys |
| **III. Code Quality** | ✅ PASS | TypeScript strict; Zod validation; follows existing patterns |
| **IV. Testing Requirements** | ✅ PASS | Playwright E2E tests required per spec |
| **V. Simplicity & MVP Focus** | ✅ PASS | Traces to spec requirements; reuses shared components |

**Gate Result**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-adaimozhi/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API schemas)
│   ├── student.ts
│   └── teacher.ts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Next.js App Router structure (existing pattern)

src/
├── app/
│   ├── (dashboard)/
│   │   ├── practice/
│   │   │   └── adaimozhi/          # NEW: Student practice page
│   │   │       └── page.tsx
│   │   └── teacher/
│   │       └── practice/
│   │           └── adaimozhi/      # NEW: Teacher content management
│   │               ├── page.tsx
│   │               ├── new/
│   │               │   └── page.tsx
│   │               └── import/
│   │                   └── page.tsx
│   └── api/
│       ├── practice/
│       │   └── adaimozhi/          # NEW: Student practice API
│       │       ├── route.ts
│       │       └── sessions/
│       │           └── [attemptId]/
│       │               ├── next/route.ts
│       │               └── submit/route.ts
│       └── teacher/
│           └── practice/
│               └── adaimozhi/      # NEW: Teacher content API
│                   ├── route.ts
│                   ├── [id]/route.ts
│                   ├── import/route.ts
│                   └── generate/route.ts
├── components/
│   └── adaimozhi/                  # NEW: Feature-specific components
│       ├── AdaimozhiQuestionCard.tsx
│       ├── AdaimozhiForm.tsx
│       ├── AdaimozhiPreview.tsx
│       ├── CSVImportPreview.tsx
│       └── index.ts
└── lib/
    └── validators/
        └── practice/
            └── adaimozhi.ts        # NEW: Feature-specific validators

supabase/
└── migrations/
    └── 008_adaimozhi.sql           # NEW: Database schema + RLS

tests/
└── e2e/
    └── adaimozhi.spec.ts           # NEW: Playwright E2E tests
```

**Structure Decision**: Follows existing Next.js App Router pattern established in 001-tamil-psle-spec. Feature-specific components isolated in `src/components/adaimozhi/`. Shared practice components (QuestionShell, MCQOptions) remain untouched.

## Implementation Phases

### Phase 1: Database Schema & Validators
1. Create migration `008_adaimozhi.sql`:
   - `adaimozhi` table with RLS policies
   - Extend `attempt_answers` with `adaimozhi_id` column
   - Add uniqueness constraint on (missing_word, complete_phrase)
2. Create `src/lib/validators/practice/adaimozhi.ts`

### Phase 2: Student Practice API & UI
1. Create `/api/practice/adaimozhi/` routes (sessions, next, submit)
2. Create `/practice/adaimozhi/page.tsx` using shared hooks/components
3. Create `AdaimozhiQuestionCard` component

### Phase 3: Teacher Content Management
1. Create `/api/teacher/practice/adaimozhi/` routes (CRUD, import, generate)
2. Create teacher UI pages (list, create, import)
3. Implement AI-assisted generation with rate limiting

### Phase 4: Integration & Testing
1. Verify integration with adaimozhi_echcham section
2. Create Playwright E2E tests
3. Seed test data

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Insufficient DB entries for distractors | AI fallback with logging (FR-009, FR-009a) |
| Distractor duplicates | Re-query with exclusion; uniqueness check |
| Rate limit abuse on AI endpoints | 10 req/min per user (constitution compliance) |
| Attempt tracking conflicts | Mutual exclusivity constraint (question_id XOR adaimozhi_id) |

---

**Version**: 1.0.0 | **Last Updated**: 2026-01-27
