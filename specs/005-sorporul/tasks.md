# Tasks: Sorporul (Word Meanings) Practice

**Input**: Design documents from `/specs/005-sorporul/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: E2E tests are requested per spec.md testing requirements.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types, validators, and shared components for sorporul feature

- [x] T001 [P] Create Zod validation schemas in src/lib/validators/sorporul.ts
- [x] T002 [P] Create TypeScript types in src/types/sorporul.ts
- [x] T003 Create Gemini distractor generation function in src/lib/gemini/distractors.ts

**Checkpoint**: Foundation ready - validators, types, and AI integration available for all stories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API infrastructure that MUST be complete before user story UIs can work

**Note**: No new database tables required - uses existing questions, question_options, user_saved_words tables

- [x] T004 Create questions API route in src/app/api/practice/sorporul/questions/route.ts (GET for students, POST for teachers)
- [x] T005 Create questions status update route in src/app/api/practice/sorporul/questions/[id]/route.ts (PATCH for publish/unpublish)

**Checkpoint**: Core APIs ready - student practice and teacher content management can now proceed

---

## Phase 3: User Story 1 - Student Practices Word Meanings (Priority: P1)

**Goal**: Students select correct Tamil definition for a given Tamil word from MCQ options

**Independent Test**: Login as student → start sorporul practice → answer MCQ → verify feedback shown

### Implementation for User Story 1

- [x] T006 [P] [US1] Create SorporulQuestionCard component in src/components/sorporul/SorporulQuestionCard.tsx
- [x] T007 [US1] Create student practice page in src/app/(dashboard)/practice/sorporul/page.tsx
- [x] T008 [US1] Integrate WordGlossaryPopover for any-word meaning lookup in practice page
- [x] T009 [US1] Integrate SaveWordButton for saving words during practice

**Checkpoint**: User Story 1 complete - students can practice sorporul questions with word lookup and save functionality

---

## Phase 4: User Story 2 - Student Saves Words to Vocabulary Bank (Priority: P1)

**Goal**: Students save unfamiliar words to personal vocabulary bank and view them in a searchable list

**Independent Test**: Save word during practice → navigate to /vocab → verify word appears with definitions and search works

**Dependencies**: US1 provides the save integration; this story provides the listing UI

### Implementation for User Story 2

- [x] T010 [US2] Create vocabulary bank page with search in src/app/(dashboard)/vocab/page.tsx
- [x] T011 [US2] Add debounced search filtering for word list
- [x] T012 [US2] Add word deletion functionality with confirmation

**Checkpoint**: User Story 2 complete - students can view, search, and manage their saved vocabulary

---

## Phase 5: User Story 3 - Student Reviews Vocabulary with Flashcards (Priority: P2)

**Goal**: Students review saved words with flashcards using spaced repetition (again/hard/good ratings)

**Independent Test**: Navigate to /vocab/review → view flashcard → click "Show Answer" → rate recall → verify next review date updates

### Implementation for User Story 3

- [x] T013 [P] [US3] Create VocabFlashcard component in src/components/sorporul/VocabFlashcard.tsx
- [x] T014 [US3] Create flashcard review page in src/app/(dashboard)/vocab/review/page.tsx
- [x] T015 [US3] Integrate with existing /api/vocab/review endpoint for SM-2 scheduling
- [x] T016 [US3] Handle empty state (no words due for review)

**Checkpoint**: User Story 3 complete - students can review vocabulary with spaced repetition

---

## Phase 6: User Story 4 - Teacher Adds Sorporul Questions via Manual Entry (Priority: P2)

**Goal**: Teachers create individual word meaning questions through a form interface

**Independent Test**: Login as teacher → navigate to question management → create question → publish → verify appears in student practice

### Implementation for User Story 4

- [x] T017 [P] [US4] Create teacher questions list page in src/app/(dashboard)/teacher/practice/sorporul/page.tsx
- [x] T018 [US4] Create manual question entry form in src/app/(dashboard)/teacher/practice/sorporul/new/page.tsx
- [x] T019 [US4] Add publish/unpublish toggle functionality
- [ ] T020 [US4] Add question editing capability

**Checkpoint**: User Story 4 complete - teachers can create and manage sorporul questions manually

---

## Phase 7: User Story 5 - Teacher Imports Questions via CSV (Priority: P2)

**Goal**: Teachers upload CSV files to bulk import questions with preview and error handling

**Independent Test**: Prepare CSV with 3 questions → upload → review preview → confirm import → verify questions appear as drafts

### Implementation for User Story 5

- [x] T021 [P] [US5] Create CSV import API route in src/app/api/practice/sorporul/import-csv/route.ts
- [x] T022 [P] [US5] Create CSVImportPreview component in src/components/sorporul/CSVImportPreview.tsx
- [x] T023 [US5] Create CSV import page in src/app/(dashboard)/teacher/practice/sorporul/import/page.tsx
- [x] T024 [US5] Handle CSV validation errors with row-level feedback
- [x] T025 [US5] Implement import confirmation flow

**Checkpoint**: User Story 5 complete - teachers can bulk import questions via CSV

---

## Phase 8: User Story 6 - Teacher Generates Distractors with AI (Priority: P3)

**Goal**: Teachers enter target word and correct definition, AI generates plausible distractor definitions

**Independent Test**: Enter word and definition → click "Generate Distractors" → verify 3 Tamil distractors returned

### Implementation for User Story 6

- [x] T026 [P] [US6] Create distractor generation API route in src/app/api/practice/sorporul/generate-distractors/route.ts
- [x] T027 [US6] Add rate limiting (10 requests/min) to distractor API
- [x] T028 [US6] Integrate "Generate Distractors" button in question creation form
- [x] T029 [US6] Handle AI generation failure with graceful fallback

**Checkpoint**: User Story 6 complete - teachers can use AI to generate question distractors

---

## Phase 9: E2E Tests

**Purpose**: Playwright tests for critical paths per spec.md testing requirements

- [x] T030 [P] Create E2E test suite in tests/sorporul.spec.ts (route existence, auth protection, API availability)

**Note**: E2E tests created at tests/sorporul.spec.ts covering:
- Page route existence tests (sorporul practice, vocab bank, vocab review, teacher pages)
- Authentication redirect tests (unauthenticated access redirects to login)
- API route existence tests (questions, vocab review, generate-distractors, import-csv)
- API validation tests

**Checkpoint**: E2E tests created - require Supabase env vars to run (copy .env.example to .env.local)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T033 Run TypeScript compilation and fix any errors
- [ ] T034 Run lint checks and fix any warnings
- [ ] T035 Verify all Zod schemas match API contracts
- [ ] T036 Run quickstart.md validation steps
- [ ] T037 Manual testing of Tamil text rendering across browsers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phases 3-8 (User Stories)**: All depend on Phase 2 completion
- **Phase 9 (E2E Tests)**: Depends on US1-US3 completion minimum
- **Phase 10 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

```
                    ┌─ US3 (Review)
US1 (Practice) ───► US2 (Vocab Bank) ─┤
                    └─ (independent)

US4 (Manual Entry) ──► US5 (CSV Import) ──► US6 (AI Distractors)
```

- **US1 (P1)**: Can start after Phase 2 - Core practice functionality
- **US2 (P1)**: Can start after Phase 2 - Integrates with US1's save functionality
- **US3 (P2)**: Can start after Phase 2 - Uses vocab from US2
- **US4 (P2)**: Can start after Phase 2 - Independent teacher flow
- **US5 (P2)**: Can start after Phase 2 - Extends US4's question management
- **US6 (P3)**: Can start after Phase 2 - Enhances US4's creation form

### Parallel Opportunities

**Phase 1 (all parallel)**:
```
T001: validators/sorporul.ts
T002: types/sorporul.ts
```

**After Phase 2 completes, these story groups can run in parallel**:

Student stories (US1 → US2 → US3):
```
T006-T009 → T010-T012 → T013-T016
```

Teacher stories (US4 → US5 → US6):
```
T017-T020 → T021-T025 → T026-T029
```

**E2E tests (all parallel)**:
```
T030, T031, T032 (different test files)
```

---

## Implementation Strategy

### MVP First (User Stories 1-2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T009)
4. Complete Phase 4: User Story 2 (T010-T012)
5. **STOP and VALIDATE**: Students can practice sorporul and save words
6. Deploy/demo if ready

### Incremental Delivery

1. **MVP (US1+US2)**: Student practice + vocab bank → Deploy
2. **+US3**: Flashcard review → Deploy
3. **+US4**: Teacher manual entry → Deploy
4. **+US5**: CSV import → Deploy
5. **+US6**: AI distractors → Deploy
6. **+E2E**: Full test coverage → Production ready

### Suggested MVP Scope

For fastest time-to-value:
- **Include**: US1, US2 (student practice + vocab saving)
- **Defer**: US3-US6 (review and teacher features)
- **Reason**: Students can immediately practice and save words; teacher content can be seeded via database

---

## Notes

- All APIs use Zod validation per FR-018
- Rate limiting applied to AI endpoint per FR-019
- Uses existing shared components (WordGlossaryPopover, SaveWordButton, useVocabBank) - DO NOT modify
- Uses existing tables (questions, user_saved_words, etc.) - no migrations needed
- Tamil text uses `font-tamil` class for proper rendering
