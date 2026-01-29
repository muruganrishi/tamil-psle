# Tasks: Adaimozhi (அடைமொழி / Epithets & Compound Phrases)

**Input**: Design documents from `/specs/003-adaimozhi/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: E2E Playwright tests included as specified in the feature requirements (Testing Requirements section of spec.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `src/app/`, `src/components/`, `src/lib/`
- **Supabase migrations**: `supabase/migrations/`
- **E2E tests**: `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, validators, and foundational components

- [ ] T001 Create database migration file at supabase/migrations/008_adaimozhi.sql with adaimozhi table
- [ ] T002 Add RLS policies for adaimozhi table in supabase/migrations/008_adaimozhi.sql
- [ ] T003 Extend attempt_answers table with adaimozhi_id column and XOR constraint in supabase/migrations/008_adaimozhi.sql
- [ ] T004 Create Zod validators at src/lib/validators/practice/adaimozhi.ts
- [ ] T005 [P] Create component barrel file at src/components/adaimozhi/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and helpers that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Apply migration to database (supabase db push)
- [ ] T007 [P] Create distractor selection utility function in src/lib/utils/adaimozhi-distractors.ts
- [ ] T008 [P] Create AI fallback distractor generator using Gemini in src/lib/ai/adaimozhi-fallback.ts
- [ ] T009 Verify RLS policies work correctly for student/teacher/admin roles

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Student Practices Adaimozhi (Priority: P1) 🎯 MVP

**Goal**: Students can complete fill-in-blank adaimozhi questions with DB-driven distractors

**Independent Test**: Login as student → Start practice → See phrase with blank → Select answer → View results with correct phrase and meaning

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create GET /api/practice/adaimozhi/route.ts for fetching questions with distractors
- [ ] T011 [P] [US1] Create POST /api/practice/adaimozhi/sessions/route.ts for starting practice session
- [ ] T012 [US1] Create GET /api/practice/adaimozhi/sessions/[attemptId]/next/route.ts for next question
- [ ] T013 [US1] Create POST /api/practice/adaimozhi/sessions/[attemptId]/submit/route.ts for answer submission
- [ ] T014 [P] [US1] Create AdaimozhiQuestionCard component in src/components/adaimozhi/AdaimozhiQuestionCard.tsx
- [ ] T015 [US1] Create student practice page at src/app/(dashboard)/practice/adaimozhi/page.tsx using shared QuestionShell and MCQOptions
- [ ] T016 [US1] Integrate distractor selection (DB-first with AI fallback) in practice API
- [ ] T017 [US1] Add AI fallback logging for admin monitoring in practice API

**Checkpoint**: Students can practice adaimozhi questions end-to-end

---

## Phase 4: User Story 2 - Word Meaning on Tap/Hover (Priority: P1)

**Goal**: Students can tap/hover Tamil words in phrases to see contextual meanings

**Independent Test**: Hover/tap any Tamil word in phrase → See meaning popover within 2 seconds

### Implementation for User Story 2

- [ ] T018 [US2] Integrate TokenizedText component in AdaimozhiQuestionCard for word tokenization
- [ ] T019 [US2] Connect WordGlossaryPopover to tokenized phrase text (reuse existing shared component)
- [ ] T020 [US2] Verify meaning popover appears within 2 seconds performance target

**Checkpoint**: Word meanings work on tap/hover in adaimozhi practice

---

## Phase 5: User Story 3 - Teacher Imports CSV (Priority: P2)

**Goal**: Teachers can bulk import adaimozhi entries via CSV upload

**Independent Test**: Upload CSV → See preview with validation → Confirm → Entries created as drafts

### Implementation for User Story 3

- [ ] T021 [P] [US3] Create POST /api/teacher/practice/adaimozhi/import/route.ts for CSV parsing and preview
- [ ] T022 [P] [US3] Create CSV validation logic with row-level error reporting in import route
- [ ] T023 [P] [US3] Create CSVImportPreview component in src/components/adaimozhi/CSVImportPreview.tsx
- [ ] T024 [US3] Create import confirmation endpoint in /api/teacher/practice/adaimozhi/import/route.ts (POST with confirm action)
- [ ] T025 [US3] Create teacher import page at src/app/(dashboard)/teacher/practice/adaimozhi/import/page.tsx
- [ ] T026 [US3] Implement duplicate detection (missing_word + complete_phrase) in import flow

**Checkpoint**: Teachers can import adaimozhi entries via CSV

---

## Phase 6: User Story 4 - Teacher Creates Manual Entry (Priority: P2)

**Goal**: Teachers can manually create/edit adaimozhi entries with live preview

**Independent Test**: Fill form → See live preview → Save as draft → Publish → Visible to students

### Implementation for User Story 4

- [ ] T027 [P] [US4] Create GET /api/teacher/practice/adaimozhi/route.ts for listing entries
- [ ] T028 [P] [US4] Create POST /api/teacher/practice/adaimozhi/route.ts for creating entries
- [ ] T029 [P] [US4] Create GET/PATCH/DELETE /api/teacher/practice/adaimozhi/[id]/route.ts for single entry operations
- [ ] T030 [P] [US4] Create AdaimozhiForm component in src/components/adaimozhi/AdaimozhiForm.tsx
- [ ] T031 [P] [US4] Create AdaimozhiPreview component in src/components/adaimozhi/AdaimozhiPreview.tsx
- [ ] T032 [US4] Create teacher list page at src/app/(dashboard)/teacher/practice/adaimozhi/page.tsx with status filter tabs
- [ ] T033 [US4] Create teacher create/edit page at src/app/(dashboard)/teacher/practice/adaimozhi/new/page.tsx
- [ ] T034 [US4] Implement publish/unpublish functionality with RLS enforcement

**Checkpoint**: Teachers can create and manage adaimozhi entries manually

---

## Phase 7: User Story 5 - Teacher Uses AI Assist (Priority: P3)

**Goal**: Teachers can use AI to generate new epithet phrases

**Independent Test**: Click AI Assist → Enter topic → Get suggestions → Select to populate form

### Implementation for User Story 5

- [ ] T035 [P] [US5] Create POST /api/teacher/practice/adaimozhi/generate/route.ts for AI generation
- [ ] T036 [US5] Implement Gemini prompt for adaimozhi phrase generation with strict JSON output
- [ ] T037 [US5] Add rate limiting (10 req/min per user) to AI generate endpoint
- [ ] T038 [US5] Integrate AI Assist button in AdaimozhiForm component
- [ ] T039 [US5] Implement suggestion selection to populate form fields

**Checkpoint**: Teachers can use AI to generate adaimozhi content

---

## Phase 8: E2E Tests & Polish

**Purpose**: Playwright E2E tests and cross-cutting improvements

### E2E Tests

- [ ] T040 [P] Create test fixtures with seed adaimozhi data in tests/fixtures/adaimozhi-seed.sql
- [ ] T041 [P] Create sample CSV file for import tests in tests/fixtures/adaimozhi-sample.csv
- [ ] T042 E2E test: Student loads adaimozhi question and sees phrase with blank in tests/e2e/adaimozhi.spec.ts
- [ ] T043 E2E test: Student answers and options include words from different adaimozhi entries in tests/e2e/adaimozhi.spec.ts
- [ ] T044 E2E test: Teacher imports CSV and entries are created as drafts in tests/e2e/adaimozhi.spec.ts
- [ ] T045 E2E test: Teacher creates manual entry and can publish it in tests/e2e/adaimozhi.spec.ts

### Polish

- [ ] T046 [P] Add error handling for edge case: no published adaimozhi entries
- [ ] T047 [P] Add loading states to all practice and teacher UI pages
- [ ] T048 Verify integration with adaimozhi_echcham section (mixed question sources)
- [ ] T049 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - core MVP
- **User Story 2 (Phase 4)**: Depends on US1 AdaimozhiQuestionCard component
- **User Story 3 (Phase 5)**: Depends on Foundational only - can parallel with US1
- **User Story 4 (Phase 6)**: Depends on Foundational only - can parallel with US1
- **User Story 5 (Phase 7)**: Depends on US4 AdaimozhiForm component
- **E2E Tests (Phase 8)**: Depends on US1, US3, US4 being complete

### User Story Dependencies

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational
    │
    ├──────────────────────┬──────────────────────┐
    ▼                      ▼                      ▼
Phase 3: US1 (P1)    Phase 5: US3 (P2)    Phase 6: US4 (P2)
Student Practice      CSV Import           Manual Entry
    │                      │                      │
    ▼                      │                      ▼
Phase 4: US2 (P1)          │              Phase 7: US5 (P3)
Word Meanings              │              AI Assist
    │                      │                      │
    └──────────────────────┴──────────────────────┘
                           │
                           ▼
                    Phase 8: E2E Tests
```

### Within Each User Story

- API routes before UI pages
- Components before pages that use them
- Core implementation before integration features

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T001, T002, T003 (same file - sequential)
T004, T005 (different files - parallel)
```

**Phase 2 (Foundational)**:
```
T007, T008 (different files - parallel)
```

**Phase 3 (US1)**:
```
T010, T011 (different route files - parallel)
T014 (component - parallel with routes)
```

**Phases 3, 5, 6 can run in parallel** (different user stories, minimal overlap)

---

## Parallel Example: User Story 1 Implementation

```bash
# Launch API routes in parallel:
Task: "T010 [P] [US1] Create GET /api/practice/adaimozhi/route.ts"
Task: "T011 [P] [US1] Create POST /api/practice/adaimozhi/sessions/route.ts"
Task: "T014 [P] [US1] Create AdaimozhiQuestionCard component"

# Then sequentially (depends on T010, T011):
Task: "T012 [US1] Create next question route"
Task: "T013 [US1] Create submit answer route"
Task: "T015 [US1] Create practice page"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 - Student Practice
4. Complete Phase 4: User Story 2 - Word Meanings
5. **STOP and VALIDATE**: Test student practice flow end-to-end
6. Deploy/demo if ready

**MVP Deliverable**: Students can practice adaimozhi with DB-driven distractors and word meanings

### Incremental Delivery

1. MVP (US1 + US2) → Student practice works
2. Add US3 (CSV Import) → Teachers can bulk add content
3. Add US4 (Manual Entry) → Teachers can individually manage content
4. Add US5 (AI Assist) → Teachers get AI help (nice-to-have)
5. E2E Tests → Full test coverage

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Student Practice) → US2 (Word Meanings)
   - Developer B: US3 (CSV Import) → US4 (Manual Entry)
3. Sync up for US5 and E2E tests

---

## Task Summary

| Phase | User Story | Task Count | Parallel Tasks |
|-------|------------|------------|----------------|
| 1 | Setup | 5 | 2 |
| 2 | Foundational | 4 | 2 |
| 3 | US1 - Student Practice | 8 | 4 |
| 4 | US2 - Word Meanings | 3 | 0 |
| 5 | US3 - CSV Import | 6 | 3 |
| 6 | US4 - Manual Entry | 8 | 5 |
| 7 | US5 - AI Assist | 5 | 1 |
| 8 | E2E Tests & Polish | 10 | 4 |
| **Total** | | **49** | **21** |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **READ-ONLY paths**: Do not modify src/components/practice/*, src/hooks/practice/*, src/types/practice/*
