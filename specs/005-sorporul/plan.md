# Implementation Plan: Sorporul (Word Meanings) Practice

**Branch**: `005-sorporul` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-sorporul/spec.md`

## Summary

Implement the சொற்பொருள் (Sorporul / Word Meanings) practice feature where students select the correct Tamil definition for a given Tamil word from MCQ options. Includes vocabulary bank UI for saving, searching, and reviewing words with spaced repetition. Teachers can add questions via manual entry, CSV import, or AI-assisted distractor generation.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 14+ (App Router), React 18, shadcn/ui, Tailwind CSS, Zod, @supabase/supabase-js, @google/generative-ai
**Storage**: Supabase PostgreSQL (existing tables: questions, question_options, user_saved_words, word_sense_cache, user_vocab_reviews)
**Testing**: Playwright E2E
**Target Platform**: Web (Vercel), mobile-responsive
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 10-question session in under 5 minutes; word meaning lookup < 2 seconds
**Constraints**: Use existing shared infrastructure (read-only); RLS required on all tables
**Scale/Scope**: MVP for Singapore primary school students, <100 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Privacy-First** | PASS | Student vocab data is user-owned; RLS enforces owner-only access |
| **II. Security by Default** | PASS | All API routes require auth; Gemini key server-side only; rate limiting (10/min) on AI endpoints |
| **III. Code Quality Standards** | PASS | TypeScript strict; Zod schemas for all APIs; follows existing patterns |
| **IV. Testing Requirements** | PASS | E2E tests specified for: practice flow, word save, vocab review |
| **V. Simplicity & MVP Focus** | PASS | Uses existing hooks/components; no new patterns beyond necessity |

**Gate Result**: PASS - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/005-sorporul/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── practice-sorporul.ts
│   └── teacher-sorporul.ts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (dashboard)/
│   │   ├── practice/sorporul/          # Student practice page (NEW)
│   │   │   └── page.tsx
│   │   ├── vocab/                      # Vocabulary bank (NEW)
│   │   │   ├── page.tsx                # List saved words
│   │   │   └── review/
│   │   │       └── page.tsx            # Flashcard review
│   │   └── teacher/
│   │       └── practice/
│   │           └── sorporul/           # Teacher content mgmt (NEW)
│   │               ├── page.tsx        # List questions
│   │               ├── new/
│   │               │   └── page.tsx    # Manual entry form
│   │               └── import/
│   │                   └── page.tsx    # CSV import
│   └── api/
│       └── practice/
│           └── sorporul/               # Practice session APIs (NEW)
│               ├── route.ts            # GET questions, POST create
│               ├── import-csv/
│               │   └── route.ts        # CSV import
│               └── generate-distractors/
│                   └── route.ts        # AI distractor generation
├── components/
│   └── sorporul/                       # Feature-specific components (NEW)
│       ├── SorporulQuestionCard.tsx
│       ├── VocabFlashcard.tsx
│       └── CSVImportPreview.tsx
├── lib/
│   ├── gemini/
│   │   └── distractors.ts              # Distractor generation (NEW)
│   └── validators/
│       └── sorporul.ts                 # Zod schemas (NEW)
└── types/
    └── sorporul.ts                     # Feature types (NEW)

tests/
└── e2e/
    └── sorporul.spec.ts                # Playwright tests (NEW)
```

**Structure Decision**: Web application using Next.js App Router conventions. All new code goes in owned paths per CLAUDE.md. Leverages existing shared infrastructure (read-only).

## Complexity Tracking

> No constitution violations requiring justification.

---

## Phase 0: Research Summary

See [research.md](./research.md) for detailed findings.

### Key Decisions

1. **Question Storage**: Use existing `questions` table with `section='sorporul'`. Target word stored in `question_text`, options in `question_options` table (Tamil definitions as option text).

2. **API Pattern**: Follow existing `/api/questions` pattern for teacher APIs. Use `/api/practice/sorporul/` namespace for practice-specific endpoints to avoid modifying shared infrastructure.

3. **AI Distractor Generation**: New function in `src/lib/gemini/distractors.ts` following existing `client.ts` pattern with strict JSON output schema.

4. **Vocabulary Bank**: Extend existing `/saved-words` page with search. Create new `/vocab/review` page for flashcard UI using existing `useVocabBank` hook and `/api/vocab/review` endpoint.

---

## Phase 1: Design Artifacts

### Data Model

See [data-model.md](./data-model.md) for entity definitions.

**Key Points**:
- No new database tables required
- Sorporul questions use existing `questions` + `question_options` tables
- `section='sorporul'` distinguishes this question type
- Target word is the `question_text` field
- Options are Tamil definitions (correct answer has `is_correct=true`)

### API Contracts

See [contracts/](./contracts/) for OpenAPI-style type definitions.

**Endpoints Created**:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/practice/sorporul/questions` | Fetch sorporul questions for practice |
| POST | `/api/practice/sorporul/questions` | Create sorporul question (teacher) |
| POST | `/api/practice/sorporul/import-csv` | Bulk import from CSV |
| POST | `/api/practice/sorporul/generate-distractors` | AI distractor generation |

### Quickstart

See [quickstart.md](./quickstart.md) for developer onboarding.

---

## Implementation Phases

### Phase 1: Validators & Types (Foundation)

**Files**:
- `src/lib/validators/sorporul.ts` - Zod schemas
- `src/types/sorporul.ts` - TypeScript types

**Key Schemas**:
- `SorporulQuestionSchema` - Question with target word + 4 definition options
- `SorporulCSVRowSchema` - CSV import row validation
- `AIDistractorRequestSchema` / `AIDistractorResponseSchema` - Gemini API types

### Phase 2: Student Practice Flow

**Files**:
- `src/app/(dashboard)/practice/sorporul/page.tsx` - Practice page
- `src/components/sorporul/SorporulQuestionCard.tsx` - Question display
- `src/app/api/practice/sorporul/questions/route.ts` - Questions API

**Implementation**:
1. Practice page fetches questions with `section=sorporul`
2. Question card displays target word prominently with 4 definition options
3. Integrates WordGlossaryPopover for any-word lookup
4. Integrates SaveWordButton for saving to vocabulary
5. Uses existing `/api/attempts` for submission

### Phase 3: Vocabulary Bank UI

**Files**:
- `src/app/(dashboard)/vocab/page.tsx` - Enhanced word list with search
- `src/app/(dashboard)/vocab/review/page.tsx` - Flashcard review
- `src/components/sorporul/VocabFlashcard.tsx` - Flashcard component

**Implementation**:
1. Vocab page uses `useVocabBank` hook for data
2. Add search input with debounce for filtering
3. Review page shows flashcard (word → reveal → rate)
4. Rating buttons POST to existing `/api/vocab/review`

### Phase 4: Teacher Content APIs

**Files**:
- `src/app/api/practice/sorporul/questions/route.ts` - GET/POST questions
- `src/app/api/practice/sorporul/import-csv/route.ts` - CSV import
- `src/app/api/practice/sorporul/generate-distractors/route.ts` - AI generation
- `src/lib/gemini/distractors.ts` - Gemini integration

**Implementation**:
1. Questions API follows admin pattern with teacher role check
2. CSV import parses, validates rows, returns preview with errors
3. Distractor API calls Gemini with structured prompt, rate limited

### Phase 5: Teacher Content UI

**Files**:
- `src/app/(dashboard)/teacher/practice/sorporul/page.tsx` - List view
- `src/app/(dashboard)/teacher/practice/sorporul/new/page.tsx` - Create form
- `src/app/(dashboard)/teacher/practice/sorporul/import/page.tsx` - CSV import
- `src/components/sorporul/CSVImportPreview.tsx` - Import preview table

**Implementation**:
1. List page shows teacher's sorporul questions with status filter
2. Create form: target word, correct definition, 3 distractors, AI assist button
3. Import page: file upload → preview → confirm

### Phase 6: E2E Tests

**Files**:
- `tests/e2e/sorporul.spec.ts`

**Test Cases**:
1. Student completes sorporul practice session
2. Student saves word during practice, sees in vocab list
3. Student performs flashcard review, schedule updates
4. (Optional) Teacher imports CSV successfully

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Gemini API unavailable | Graceful error with manual entry fallback |
| Large CSV uploads | Client-side row limit (1000); server validation |
| Tamil text rendering | Use existing `font-tamil` class; test on multiple browsers |
| Rate limit hit during practice | Meaning lookup is user-initiated; 60/min sufficient |

---

## Definition of Done

Per Constitution checklist:
- [ ] TypeScript compiles with zero errors
- [ ] All Zod schemas validate inputs/outputs
- [ ] Lint and format checks pass
- [ ] RLS policies verified (using existing tables)
- [ ] Playwright tests pass for critical paths
- [ ] No secrets in client-facing code
- [ ] PR links to tasks
- [ ] Deployed to preview and manually verified
