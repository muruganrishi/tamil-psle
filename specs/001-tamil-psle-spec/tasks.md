# Tasks: TamilPSLE Exam-Prep App

**Input**: Design documents from `/specs/001-tamil-psle-spec/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Generated**: 2026-01-16

**Tests**: Playwright E2E smoke tests are included as specified in the constitution (Day 7 testing requirement).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- Source code: `src/` at repository root
- Migrations: `supabase/migrations/`
- Tests: `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js project with TypeScript, App Router, Tailwind via create-next-app
- [ ] T002 [P] Configure TypeScript strict mode in tsconfig.json
- [ ] T003 [P] Set up ESLint + Prettier with recommended configs in .eslintrc.json and .prettierrc
- [ ] T004 [P] Initialize shadcn/ui with default theme in components.json
- [ ] T005 [P] Create environment variable templates in .env.example and .env.local
- [ ] T006 Install dependencies: @supabase/supabase-js, @supabase/ssr, zod, @google/generative-ai in package.json
- [ ] T007 [P] Create Supabase browser client in src/lib/supabase/client.ts
- [ ] T008 [P] Create Supabase server client in src/lib/supabase/server.ts
- [ ] T009 Create Next.js auth middleware in src/middleware.ts
- [ ] T010 [P] Create utility functions in src/lib/utils.ts
- [ ] T011 [P] Add shadcn/ui components: Button, Card, Dialog, Popover, Form, Input, Select, Table, Toast

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Types

- [ ] T012 Create migration 001_profiles.sql with user_role enum, language_mode enum, profiles table, and auto-create trigger in supabase/migrations/001_profiles.sql
- [ ] T013 Create migration 002_questions_passages.sql with question_section enum, content_status enum, passages table, questions table, question_options table in supabase/migrations/002_questions_passages.sql
- [ ] T014 Create migration 003_attempts.sql with attempts table, attempt_answers table in supabase/migrations/003_attempts.sql
- [ ] T015 Create migration 004_word_cache.sql with word_sense_cache table, user_saved_words table in supabase/migrations/004_word_cache.sql
- [ ] T016 Create migration 005_classes_assignments.sql with classes table, class_members table, assignments table in supabase/migrations/005_classes_assignments.sql
- [ ] T017 Create migration 006_rls_policies.sql with all RLS policies for all tables in supabase/migrations/006_rls_policies.sql
- [ ] T018 Generate TypeScript types from Supabase schema in src/types/database.ts

### Authentication

- [ ] T019 Create auth layout with redirect logic in src/app/(auth)/layout.tsx
- [ ] T020 [P] Create login page with email/password form in src/app/(auth)/login/page.tsx
- [ ] T021 [P] Create signup page with email/password form in src/app/(auth)/signup/page.tsx
- [ ] T022 Create dashboard layout with role-based navigation in src/app/(dashboard)/layout.tsx

### Zod Validators (from contracts/)

- [ ] T023 [P] Copy meaning validators from contracts to src/lib/validators/meaning.ts
- [ ] T024 [P] Copy questions validators from contracts to src/lib/validators/questions.ts
- [ ] T025 [P] Copy attempts validators from contracts to src/lib/validators/attempts.ts
- [ ] T026 [P] Copy assignments validators from contracts to src/lib/validators/assignments.ts

### Shared Components

- [ ] T027 Create root layout with providers in src/app/layout.tsx
- [ ] T028 Create landing page with login/signup links in src/app/page.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Student Practice Session (Priority: P1) 🎯 MVP

**Goal**: A student selects a practice section, answers MCQ questions, and sees their score with correct answers highlighted.

**Independent Test**: Log in as student, select a section, answer 5 questions, verify score display.

### Implementation for User Story 1

- [ ] T029 [P] [US1] Create section picker component in src/components/section-picker.tsx
- [ ] T030 [P] [US1] Create MCQ card component with 4 options in src/components/mcq-card.tsx
- [ ] T031 [P] [US1] Create results summary component in src/components/results-summary.tsx
- [ ] T032 [US1] Create GET /api/questions route with adaptive selection in src/app/api/questions/route.ts
- [ ] T033 [US1] Create POST /api/attempts route for submission in src/app/api/attempts/route.ts
- [ ] T034 [US1] Create student dashboard page with section selection in src/app/(dashboard)/student/page.tsx
- [ ] T035 [US1] Create practice session page with MCQ flow in src/app/(dashboard)/student/practice/[section]/page.tsx
- [ ] T036 [US1] Create results page with score and answers in src/app/(dashboard)/student/results/[attemptId]/page.tsx
- [ ] T037 [US1] Create seed.sql with sample questions for all 6 sections in supabase/seed.sql

**Checkpoint**: Student can complete a practice session and view results independently

---

## Phase 4: User Story 2 - Contextual Word Meaning (Priority: P1) 🎯 MVP

**Goal**: A student hovers/taps any Tamil word to see its contextual meaning in their preferred language.

**Independent Test**: Display Tamil text, hover/tap a word, verify meaning popover appears within 2 seconds.

### Implementation for User Story 2

- [ ] T038 [P] [US2] Create Gemini client wrapper in src/lib/gemini/client.ts
- [ ] T039 [P] [US2] Create rate limiting utility in src/lib/rate-limit.ts
- [ ] T040 [P] [US2] Create tokenized text component for Tamil word detection in src/components/tokenized-text.tsx
- [ ] T041 [P] [US2] Create meaning popover component in src/components/meaning-popover.tsx
- [ ] T042 [US2] Create POST /api/meaning route with caching and rate limiting in src/app/api/meaning/route.ts
- [ ] T043 [US2] Create language toggle component in src/components/language-toggle.tsx
- [ ] T044 [US2] Integrate tokenized text into MCQ card component in src/components/mcq-card.tsx
- [ ] T045 [US2] Add language preference to user profile settings

**Checkpoint**: Word meaning lookup works independently on any Tamil text

---

## Phase 5: User Story 3 - Save Words for Review (Priority: P2)

**Goal**: A student can save unfamiliar words to a personal vocabulary list for later review.

**Independent Test**: Save a word from popover, verify it appears in Saved Words page.

### Implementation for User Story 3

- [ ] T046 [P] [US3] Add save button to meaning popover component in src/components/meaning-popover.tsx
- [ ] T047 [US3] Create POST/GET/DELETE /api/saved-words route in src/app/api/saved-words/route.ts
- [ ] T048 [US3] Create saved words list page in src/app/(dashboard)/student/saved-words/page.tsx

**Checkpoint**: Students can save, view, and remove words from their vocabulary list

---

## Phase 6: User Story 4 - Teacher Class Management (Priority: P2)

**Goal**: A teacher creates a class with a unique join code. Students join and appear on the roster.

**Independent Test**: Create class as teacher, join as student with code, verify student appears in roster.

### Implementation for User Story 4

- [ ] T049 [P] [US4] Create class creation form component in src/components/class-form.tsx
- [ ] T050 [P] [US4] Create join class form component in src/components/join-class-form.tsx
- [ ] T051 [US4] Create POST/GET /api/classes route for class CRUD in src/app/api/classes/route.ts
- [ ] T052 [US4] Create POST /api/classes/join route for joining in src/app/api/classes/join/route.ts
- [ ] T053 [US4] Create teacher dashboard with class list in src/app/(dashboard)/teacher/page.tsx
- [ ] T054 [US4] Create class detail page with student roster in src/app/(dashboard)/teacher/classes/[id]/page.tsx
- [ ] T055 [US4] Create student classes page with join functionality in src/app/(dashboard)/student/classes/page.tsx

**Checkpoint**: Teachers can create classes and students can join via code

---

## Phase 7: User Story 5 - Teacher Creates Assignment (Priority: P2)

**Goal**: A teacher creates an assignment specifying section(s), question count, and max attempts (1-3).

**Independent Test**: Create assignment, log in as class student, verify assignment appears and can be completed.

### Implementation for User Story 5

- [ ] T056 [P] [US5] Create assignment form component in src/components/assignment-form.tsx
- [ ] T057 [P] [US5] Create assignment card component for student view in src/components/assignment-card.tsx
- [ ] T058 [US5] Create POST/GET /api/assignments route in src/app/api/assignments/route.ts
- [ ] T059 [US5] Create GET /api/assignments/[id] route for details in src/app/api/assignments/[id]/route.ts
- [ ] T060 [US5] Create assignment creation page in src/app/(dashboard)/teacher/classes/[id]/assignments/new/page.tsx
- [ ] T061 [US5] Update student dashboard to show pending assignments in src/app/(dashboard)/student/page.tsx
- [ ] T062 [US5] Update practice page to enforce assignment constraints in src/app/(dashboard)/student/practice/[section]/page.tsx

**Checkpoint**: Teachers can assign practice, students see and complete assignments

---

## Phase 8: User Story 6 - Teacher Views Results (Priority: P2)

**Goal**: A teacher views completion rates and accuracy for their class and individual students.

**Independent Test**: Have students complete sessions, view results dashboard as teacher.

### Implementation for User Story 6

- [ ] T063 [P] [US6] Create assignment results table component in src/components/assignment-table.tsx
- [ ] T064 [P] [US6] Create student detail view component in src/components/student-results.tsx
- [ ] T065 [US6] Create GET /api/assignments/[id]/results route in src/app/api/assignments/[id]/results/route.ts
- [ ] T066 [US6] Create class results page in src/app/(dashboard)/teacher/classes/[id]/results/page.tsx

**Checkpoint**: Teachers can view comprehensive student progress and results

---

## Phase 9: User Story 7 - Admin Question Entry (Priority: P3)

**Goal**: An admin manually enters questions via a form or imports via CSV.

**Independent Test**: Enter a question, publish it, verify it appears in student practice.

### Implementation for User Story 7

- [ ] T067 [P] [US7] Create question form component in src/components/question-form.tsx
- [ ] T068 [P] [US7] Create CSV import preview component in src/components/csv-import-preview.tsx
- [ ] T069 [P] [US7] Create passage display component for comprehension in src/components/passage-display.tsx
- [ ] T070 [US7] Create admin dashboard page in src/app/(dashboard)/admin/page.tsx
- [ ] T071 [US7] Create question list page with filters in src/app/(dashboard)/admin/questions/page.tsx
- [ ] T072 [US7] Create question creation page in src/app/(dashboard)/admin/questions/new/page.tsx
- [ ] T073 [US7] Create CSV import page in src/app/(dashboard)/admin/questions/import/page.tsx
- [ ] T074 [US7] Create POST /api/admin/questions/import-csv route in src/app/api/admin/questions/import-csv/route.ts
- [ ] T075 [US7] Create user management page for role changes in src/app/(dashboard)/admin/users/page.tsx

**Checkpoint**: Admins can create, edit, publish questions and import via CSV

---

## Phase 10: User Story 8 - OCR Assist for Question Entry (Priority: P3)

**Goal**: An admin uploads an image of a single question. AI extracts structured MCQ data for review.

**Independent Test**: Upload a clear question image, verify extracted fields populate the form.

### Implementation for User Story 8

- [ ] T076 [P] [US8] Create image upload component in src/components/image-upload.tsx
- [ ] T077 [P] [US8] Create OCR preview component in src/components/ocr-preview.tsx
- [ ] T078 [US8] Create POST /api/admin/ocr-assist route with rate limiting in src/app/api/admin/ocr-assist/route.ts
- [ ] T079 [US8] Add OCR assist button and flow to question creation page in src/app/(dashboard)/admin/questions/new/page.tsx

**Checkpoint**: Admins can use AI to extract question data from images

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: E2E testing, deployment, and final validation

### Playwright E2E Tests (Constitution Requirement)

- [ ] T080 [P] Configure Playwright test setup in playwright.config.ts
- [ ] T081 [P] Create auth smoke test in tests/e2e/auth.spec.ts
- [ ] T082 [P] Create practice session smoke test in tests/e2e/practice.spec.ts
- [ ] T083 [P] Create hover meaning smoke test in tests/e2e/hover-meaning.spec.ts
- [ ] T084 [P] Create class join smoke test in tests/e2e/class-join.spec.ts
- [ ] T085 [P] Create assignment smoke test in tests/e2e/assignment.spec.ts
- [ ] T086 [P] Create admin question smoke test in tests/e2e/admin-question.spec.ts

### Deployment & Validation

- [ ] T087 Verify all environment variables documented in .env.example
- [ ] T088 Verify all RLS policies with test queries
- [ ] T089 Configure Vercel deployment settings
- [ ] T090 Run quickstart.md validation end-to-end
- [ ] T091 Final code cleanup and lint fixes

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────┐
                                                  │
Phase 2 (Foundational) ◄──────────────────────────┘
       │
       │ ⚠️ BLOCKS ALL USER STORIES
       ▼
┌──────┴──────┬──────────────┬──────────────┬──────────────┐
│             │              │              │              │
▼             ▼              ▼              ▼              ▼
Phase 3      Phase 4        Phase 5-6      Phase 7-8     Phase 9-10
US1 (P1)     US2 (P1)       US3-4 (P2)    US5-6 (P2)    US7-8 (P3)
Practice     Meaning        Saved/Class    Assignment    Admin
             │                   │              │
             │                   └──────────────┘
             │                          │
             └──────────────────────────┘
                              │
                              ▼
                     Phase 11 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Practice) | Phase 2 only | Foundational complete |
| US2 (Meaning) | Phase 2 only | Foundational complete |
| US3 (Saved Words) | US2 (meaning popover) | Phase 4 complete |
| US4 (Classes) | Phase 2 only | Foundational complete |
| US5 (Assignments) | US4 (classes exist) | Phase 6 complete |
| US6 (Results) | US1 + US5 (attempts + assignments) | Phase 7 complete |
| US7 (Admin Questions) | Phase 2 only | Foundational complete |
| US8 (OCR) | US7 (question form) | Phase 9 complete |

### Within Each User Story

1. Components marked [P] can be built in parallel
2. API routes after validators
3. Pages after API routes and components
4. Integration after core implementation

### Parallel Opportunities

**Setup Phase (T001-T011):**
```
T001 (init) → T002, T003, T004, T005 in parallel
T006 (deps) → T007, T008, T010, T011 in parallel
T009 (middleware) depends on T007, T008
```

**Foundational Phase (T012-T028):**
```
Migrations T012-T017 must be sequential
T018 (types) after migrations
T019-T026 validators can run in parallel
T019 (auth layout) → T020, T021 in parallel
```

**User Story 1 (T029-T037):**
```
T029, T030, T031 components in parallel
T032, T033 API routes (can run in parallel)
T034, T035, T036 pages sequential
T037 seed data anytime
```

---

## Parallel Example: User Story 2

```bash
# All components can be built in parallel:
T038: "Create Gemini client wrapper in src/lib/gemini/client.ts"
T039: "Create rate limiting utility in src/lib/rate-limit.ts"
T040: "Create tokenized text component in src/components/tokenized-text.tsx"
T041: "Create meaning popover component in src/components/meaning-popover.tsx"

# Then API route:
T042: "Create POST /api/meaning route with caching"

# Then integration:
T043, T044, T045 sequentially
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Practice)
4. Complete Phase 4: User Story 2 (Word Meaning)
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready - this is the core MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Practice) → Test → Deploy (Minimum Viable)
3. Add US2 (Meaning) → Test → Deploy (Core MVP!)
4. Add US3-4 (Saved Words + Classes) → Test → Deploy
5. Add US5-6 (Assignments + Results) → Test → Deploy
6. Add US7-8 (Admin + OCR) → Test → Deploy
7. Add Tests + Polish → Final release

### Single Developer Strategy (7 Days)

| Day | Tasks | Checkpoint |
|-----|-------|------------|
| Day 1 | T001-T028 (Setup + Foundational) | Auth working |
| Day 2 | T029-T037 (US1: Practice) | Practice session works |
| Day 3 | T038-T045 (US2: Meaning) | Word meaning works |
| Day 4 | T046-T055 (US3-4: Saved + Classes) | Classes work |
| Day 5 | T056-T066 (US5-6: Assignments + Results) | Assignments work |
| Day 6 | T067-T079 (US7-8: Admin + OCR) | Admin features work |
| Day 7 | T080-T091 (Tests + Deploy) | Production ready |

---

## Summary

| Phase | Tasks | User Story | Priority |
|-------|-------|------------|----------|
| Phase 1 | T001-T011 | Setup | - |
| Phase 2 | T012-T028 | Foundational | - |
| Phase 3 | T029-T037 | US1: Practice | P1 |
| Phase 4 | T038-T045 | US2: Meaning | P1 |
| Phase 5 | T046-T048 | US3: Saved Words | P2 |
| Phase 6 | T049-T055 | US4: Classes | P2 |
| Phase 7 | T056-T062 | US5: Assignments | P2 |
| Phase 8 | T063-T066 | US6: Results | P2 |
| Phase 9 | T067-T075 | US7: Admin | P3 |
| Phase 10 | T076-T079 | US8: OCR | P3 |
| Phase 11 | T080-T091 | Polish | - |

**Total Tasks**: 91
**MVP Tasks**: T001-T045 (45 tasks for US1 + US2)
**Parallel Opportunities**: 38 tasks marked [P]

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [USx] label maps task to specific user story
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution requires: RLS on all tables, Playwright tests, TypeScript strict mode
