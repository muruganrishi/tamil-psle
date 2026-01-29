# Feature Specification: Adaimozhi (அடைமொழி / Epithets & Compound Phrases)

**Feature Branch**: `003-adaimozhi`
**Created**: 2026-01-27
**Status**: Draft
**Input**: Feature 003-adaimozhi (அடைமொழி / Epithets & Compound Phrases) for Tamil PSLE practice app - fill-in-blank epithet/phrase completion with DB-driven distractors

---

## Overview

### Problem Statement

Tamil PSLE Section A3 (அடைமொழி/எச்சம்) requires students to complete compound phrases and epithets by selecting the correct missing word. Tamil epithets are culturally significant descriptive phrases where specific words are traditionally associated with nouns (e.g., "தாமரை கண்கள்" - lotus eyes). Students need practice with these fixed expressions to develop recognition and recall of these idiomatic patterns.

### Target Users

| Role        | Description                                       | Primary Needs                                                              |
| ----------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| **Student** | Primary school students (ages 10-12) for PSLE     | Practice fill-in-blank epithets, see phrase meaning, learn Tamil idioms    |
| **Teacher** | Tamil tutors and school teachers                  | Add epithet content via CSV/manual/AI assist, manage draft/published state |
| **Admin**   | Content managers                                  | Full access to all adaimozhi content, publish/unpublish entries            |

---

## User Scenarios & Testing

### User Story 1 - Student Practices Adaimozhi (Priority: P1)

A student practices Tamil epithets and compound phrases by completing fill-in-blank questions where they select the correct missing word from 4 MCQ options.

**Why this priority**: Core feature - without this practice flow, there is no adaimozhi feature.

**Independent Test**: Can be fully tested by logging in as a student, starting an adaimozhi practice session, answering questions with phrase blanks, and verifying results show correct/incorrect answers.

**Acceptance Scenarios**:

1. **Given** a logged-in student on the practice page, **When** they select "அடைமொழி/எச்சம்" section and click "Start Practice", **Then** they see fill-in-blank questions (from adaimozhi table) displaying a Tamil phrase with one word blanked out (e.g., "தாமரை _____").

2. **Given** a student viewing an adaimozhi question, **When** they see the 4 MCQ options, **Then** 1 option is the correct missing word and 3 options are missing words from OTHER adaimozhi entries in the database.

3. **Given** a student viewing options, **When** they examine all 4 options, **Then** there are no duplicate words among the options.

4. **Given** a student who selects an answer and submits, **When** they view results, **Then** they see whether their answer was correct and the complete phrase with meaning/explanation.

---

### User Story 2 - Word Meaning on Tap/Hover (Priority: P1)

A student can tap/hover any Tamil word in the phrase to see its contextual meaning via the existing shared vocabulary infrastructure.

**Why this priority**: Essential for learning - students need to understand unfamiliar words in phrases.

**Independent Test**: Can be tested by hovering/tapping any Tamil word in the phrase display and verifying a meaning popover appears.

**Acceptance Scenarios**:

1. **Given** a student viewing an adaimozhi question, **When** they hover over (desktop) or tap (mobile) any Tamil word in the phrase, **Then** a meaning popover appears within 2 seconds using the shared WordGlossaryPopover component.

2. **Given** the meaning popover is displayed, **When** the student views it, **Then** they see the meaning in their preferred language setting (EN/TA/BOTH) as per existing infrastructure.

---

### User Story 3 - Teacher Imports CSV (Priority: P2)

A teacher imports multiple adaimozhi entries at once via CSV file upload.

**Why this priority**: Enables bulk content creation for efficiency.

**Independent Test**: Can be tested by uploading a valid CSV file and verifying entries are created as drafts.

**Acceptance Scenarios**:

1. **Given** a logged-in teacher on the adaimozhi content management page, **When** they click "Import CSV" and upload a properly formatted CSV with columns (phrase_with_blank, missing_word, complete_phrase, meaning_ta, meaning_en), **Then** entries are created with status='draft'.

2. **Given** a CSV with validation errors, **When** uploaded, **Then** the teacher sees specific row-level error messages and valid rows are still imported.

3. **Given** successfully imported entries, **When** the teacher views them, **Then** each entry shows a preview of the phrase with blank and the missing word.

---

### User Story 4 - Teacher Creates Manual Entry (Priority: P2)

A teacher manually creates individual adaimozhi entries via a form with live preview.

**Why this priority**: Allows fine-grained content creation and editing.

**Independent Test**: Can be tested by filling the form, previewing, and saving an entry.

**Acceptance Scenarios**:

1. **Given** a logged-in teacher on the adaimozhi create page, **When** they fill in phrase_with_blank, missing_word, complete_phrase, meaning_ta, and meaning_en, **Then** they see a live preview of how the question will appear to students.

2. **Given** a teacher with a completed form, **When** they click "Save as Draft", **Then** the entry is saved with status='draft' and only visible to teachers/admins.

3. **Given** a teacher viewing their draft entry, **When** they click "Publish", **Then** the entry status changes to 'published' and becomes visible to students.

---

### User Story 5 - Teacher Uses AI Assist (Priority: P3)

A teacher uses AI assistance to generate new epithet phrases or suggest missing word options.

**Why this priority**: Nice-to-have efficiency feature; manual entry is sufficient for MVP.

**Independent Test**: Can be tested by invoking AI assist and verifying JSON output that can populate the form.

**Acceptance Scenarios**:

1. **Given** a teacher on the create/edit page, **When** they click "AI Assist" and provide a topic or partial phrase, **Then** the system returns suggested epithet phrases in strict JSON format.

2. **Given** AI-generated suggestions, **When** the teacher selects one, **Then** the form fields are populated for review before saving.

3. **Given** AI rate limit exceeded, **When** a teacher requests AI assist, **Then** they see a message "Please wait before generating more suggestions."

---

### Edge Cases

- What happens when fewer than 3 other published adaimozhi entries exist for distractors? → Fall back to AI-generated distractors that are plausible but incorrect missing words.
- What happens when a distractor would duplicate the correct answer? → Re-query excluding that word until 3 unique distractors are found.
- What happens when a teacher tries to publish without required fields? → Show validation error with specific missing fields highlighted.
- What happens when CSV contains duplicate entries (same missing_word + complete_phrase)? → Skip duplicates with warning message, import unique entries.
- What happens when the database has no published adaimozhi entries? → Show message "No practice questions available yet" on student practice page.

---

## Requirements

### Functional Requirements

**Student Practice**
- **FR-001**: System MUST display adaimozhi questions showing a Tamil phrase with exactly one word blanked out
- **FR-001a**: Adaimozhi questions MUST appear within the existing "adaimozhi_echcham" section (not as a standalone section)
- **FR-001b**: System MUST combine adaimozhi table entries with existing questions table entries (where section='adaimozhi_echcham') when serving practice sessions
- **FR-002**: System MUST provide MCQ format with exactly 4 options per question
- **FR-003**: System MUST select 3 distractors from missing_words of OTHER published adaimozhi entries (query: `SELECT DISTINCT missing_word FROM adaimozhi WHERE id != current_id AND status = 'published' ORDER BY RANDOM() LIMIT 3`)
- **FR-004**: System MUST ensure no duplicate options within a question (correct answer not in distractors)
- **FR-005**: System MUST reuse shared QuestionShell component for question display
- **FR-006**: System MUST reuse shared MCQOptions component for answer selection
- **FR-007**: System MUST support word tap/hover for meaning popover using shared WordGlossaryPopover
- **FR-008**: System MUST show only entries with status='published' to students
- **FR-009**: System MUST fall back to AI-generated distractors when fewer than 3 other entries exist
- **FR-009a**: System MUST log AI fallback usage for admin monitoring (invisible to students/teachers)

**Data Model**
- **FR-010**: System MUST store adaimozhi entries with: phrase_text (phrase with blank marker), missing_word, complete_phrase, meaning_ta, meaning_en
- **FR-011**: System MUST support status field with values: draft, published
- **FR-012**: System MUST track created_by (user who created the entry) for RLS
- **FR-013**: System MUST store created_at and updated_at timestamps
- **FR-013a**: System MUST extend attempt_answers table with nullable adaimozhi_id column (FK to adaimozhi table)
- **FR-013b**: System MUST enforce that each attempt_answers row has exactly one of question_id or adaimozhi_id set (mutual exclusivity)
- **FR-014a**: System MUST enforce uniqueness on (missing_word, complete_phrase) combination to prevent duplicate entries

**Teacher Content Input - CSV Import**
- **FR-014**: System MUST accept CSV uploads with columns: phrase_with_blank, missing_word, complete_phrase, meaning_ta, meaning_en
- **FR-015**: System MUST create imported entries with status='draft' by default
- **FR-016**: System MUST validate CSV rows and report row-level errors
- **FR-017**: System MUST allow teacher to set created_by to their own user ID

**Teacher Content Input - Manual Entry**
- **FR-018**: System MUST provide a form for creating/editing individual adaimozhi entries
- **FR-019**: System MUST show live preview of how the question will appear to students
- **FR-020**: System MUST allow saving as draft or publishing directly
- **FR-021**: System MUST allow teachers to edit their own entries (created_by = auth.uid())

**Teacher Content Input - AI Assist**
- **FR-022**: System MUST provide AI-assisted generation for new epithet phrases
- **FR-023**: System MUST return AI suggestions in strict JSON format
- **FR-024**: System MUST rate-limit AI endpoints (10 requests/minute per user)

**Access Control**
- **FR-025**: Students MUST only read entries with status='published'
- **FR-026**: Teachers MUST have full CRUD on their own content (created_by = auth.uid())
- **FR-027**: Admins MUST have full access to all adaimozhi content

### Key Entities

- **Adaimozhi**: A Tamil epithet/compound phrase entry containing the phrase with blank, the missing word, complete phrase, and bilingual meanings. Has a status (draft/published) and ownership (created_by).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Students can complete an adaimozhi practice question in under 30 seconds on average
- **SC-002**: 95% of practice questions display 4 unique options (no duplicates)
- **SC-003**: 90% of distractor options come from other database entries (not AI-generated) when sufficient entries exist
- **SC-004**: Teachers can import a 50-row CSV in under 10 seconds
- **SC-005**: Teachers can create a manual entry from form to saved draft in under 2 minutes
- **SC-006**: Word meaning popover appears within 2 seconds of hover/tap
- **SC-007**: Students can complete a 10-question adaimozhi practice session in under 8 minutes

---

## Scope Boundaries

### Owned Paths (may create/modify)
- `src/app/(dashboard)/practice/adaimozhi/**`
- `src/components/adaimozhi/**`
- `src/app/api/practice/adaimozhi/**`
- `src/app/api/teacher/practice/adaimozhi/**`
- `src/lib/validators/practice/adaimozhi.ts`
- `supabase/migrations/*_adaimozhi_*.sql`
- `tests/e2e/adaimozhi.spec.ts`

### Read-Only Paths (DO NOT MODIFY)
- `src/types/practice/**`
- `src/components/practice/**`
- `src/hooks/practice/usePracticeSession.ts`
- `src/hooks/ai/useGeminiCached.ts`
- `src/hooks/vocab/**`
- `src/lib/validators/practice/common.ts`, `student.ts`, `teacher.ts`
- `src/app/api/vocab/review/**`

---

## Assumptions

1. **Shared Infrastructure**: QuestionShell, MCQOptions, and WordGlossaryPopover components exist and are stable
2. **Database Pattern**: Follow existing table patterns from pazhamozhi/sorporul features
3. **RLS Pattern**: Follow existing RLS patterns with created_by ownership model
4. **API Pattern**: Follow existing Zod validation and error response patterns
5. **Blank Marker**: Phrase blanks use "_____" (5 underscores) as the blank marker in phrase_text
6. **Language Support**: Meanings stored in both Tamil (meaning_ta) and English (meaning_en)
7. **Single Blank**: Each adaimozhi entry has exactly one blank/missing word

---

## Constraints

1. **No Modification**: Cannot modify shared practice infrastructure (read-only paths)
2. **Distractor Source**: Must prioritize database-sourced distractors over AI-generated
3. **Content Ownership**: Teachers can only modify content they created
4. **Rate Limiting**: AI endpoints must be rate-limited to control costs

---

## Clarifications

### Session 2026-01-27

- Q: What constitutes a duplicate adaimozhi entry? → A: Duplicate = same missing_word AND complete_phrase combination
- Q: How does adaimozhi integrate with existing sections? → A: Merged into existing "adaimozhi_echcham" section alongside other question types
- Q: How are adaimozhi questions mixed with existing content? → A: Mixed with existing questions table entries for adaimozhi_echcham section
- Q: How are student answers to adaimozhi questions tracked? → A: Extend attempt_answers table with nullable adaimozhi_id column (mutually exclusive with question_id)
- Q: Should AI fallback for distractors be visible? → A: Log for admin monitoring only, invisible to students/teachers

---

**Version**: 1.1.0 | **Last Updated**: 2026-01-27
