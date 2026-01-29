# Feature Specification: Sorporul (Word Meanings) Practice

**Feature Branch**: `005-sorporul`
**Created**: 2026-01-27
**Status**: Draft
**Input**: Feature 005-sorporul (சொற்பொருள் / Word Meanings + Vocabulary Bank) for Tamil PSLE practice app.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Practices Word Meanings (Priority: P1)

A student selects the சொற்பொருள் (word meanings) practice section, sees a Tamil word as a prompt, and selects the correct Tamil definition from 4 multiple choice options.

**Why this priority**: Core functionality - the primary value proposition of this feature. Students need to practice matching Tamil words with their definitions to prepare for PSLE Section Q25.

**Independent Test**: Can be fully tested by logging in as student, starting sorporul practice, answering one MCQ question, and verifying the answer is recorded with correct/incorrect feedback.

**Acceptance Scenarios**:

1. **Given** a logged-in student on the practice page, **When** they select "சொற்பொருள்" section and click "Start Practice", **Then** they see a question displaying a Tamil target word with 4 Tamil definition options.

2. **Given** a student viewing a sorporul question, **When** they tap/click on a Tamil word in the question or options, **Then** a meaning popover appears showing the contextual definition (using the shared WordGlossaryPopover component).

3. **Given** a student who has selected an answer, **When** they click "Next" or "Submit", **Then** their answer is recorded and they see whether they were correct, with the correct answer highlighted.

4. **Given** a student completing all questions in the session, **When** they submit the practice, **Then** they see a summary showing: total score, correct/incorrect for each question, and the correct Tamil definition for any missed questions.

---

### User Story 2 - Student Saves Words to Vocabulary Bank (Priority: P1)

A student encounters an unfamiliar word during practice and saves it to their personal vocabulary bank for later review.

**Why this priority**: Essential companion to practice - enables students to build a personal study list from words they struggle with, which is critical for vocabulary retention.

**Independent Test**: Can be tested by viewing a meaning popover during practice, clicking "Save to vocabulary", then navigating to the vocabulary bank to confirm the word appears with its definition.

**Acceptance Scenarios**:

1. **Given** a student viewing a meaning popover for a Tamil word, **When** they click "Save to vocabulary", **Then** the word is saved with its Tamil and English definitions, the context sentence, and the save timestamp.

2. **Given** a student attempting to save a word already in their vocabulary bank, **When** they click "Save", **Then** they see a visual confirmation that the word is already saved (no duplicate entry created).

3. **Given** a student on the vocabulary bank page, **When** they view their saved words list, **Then** they see each word with: Tamil word, Tamil definition, English definition, context, and date saved.

---

### User Story 3 - Student Reviews Vocabulary with Flashcards (Priority: P2)

A student reviews saved vocabulary using a flashcard-style interface with spaced repetition scheduling.

**Why this priority**: Enhances learning retention through active recall. While not required for basic practice, spaced repetition is proven to improve long-term vocabulary acquisition.

**Independent Test**: Can be tested by navigating to vocabulary review, viewing a flashcard, rating recall difficulty (again/hard/good), and verifying the next review date updates accordingly.

**Acceptance Scenarios**:

1. **Given** a student with saved words due for review, **When** they navigate to vocabulary review, **Then** they see a flashcard showing the Tamil word first (definition hidden).

2. **Given** a student viewing a flashcard, **When** they click "Show Answer", **Then** they see the Tamil definition, English definition, and the original context.

3. **Given** a student viewing the answer, **When** they rate their recall as "again", "hard", or "good", **Then** the system updates the next review date using SM-2 spaced repetition algorithm and shows the next due word.

4. **Given** a student with no words due for review, **When** they navigate to vocabulary review, **Then** they see a message indicating no reviews are due with the next scheduled review date.

---

### User Story 4 - Teacher Adds Sorporul Questions via Manual Entry (Priority: P2)

A teacher creates individual word meaning questions through a form interface.

**Why this priority**: Content must exist for students to practice. Manual entry ensures quality control over question content.

**Independent Test**: Can be tested by logging in as teacher, navigating to question management, creating a sorporul question with target word and 4 definition options, publishing it, then verifying it appears in student practice.

**Acceptance Scenarios**:

1. **Given** a teacher on the question management page, **When** they click "Add Question" and select "சொற்பொருள்" section, **Then** they see a form with: target Tamil word field, 4 Tamil definition option fields, correct answer selector.

2. **Given** a teacher filling the question form with valid data, **When** they click "Save", **Then** the question is saved as draft and visible in their question list.

3. **Given** a draft sorporul question, **When** the teacher clicks "Publish", **Then** the question becomes available in the student practice pool.

---

### User Story 5 - Teacher Imports Questions via CSV (Priority: P2)

A teacher uploads a CSV file containing multiple word meaning questions for bulk import.

**Why this priority**: Efficiency feature enabling teachers to add many questions at once, reducing manual data entry time.

**Independent Test**: Can be tested by preparing a valid CSV with 3 questions, uploading it, reviewing the preview, confirming import, and verifying questions appear as drafts.

**Acceptance Scenarios**:

1. **Given** a teacher on the import page, **When** they upload a properly formatted CSV file, **Then** they see a preview table showing: row number, target word, 4 options, correct answer, and any validation errors per row.

2. **Given** a CSV preview with no errors, **When** the teacher clicks "Import", **Then** questions are created as drafts with a success message showing count imported.

3. **Given** a CSV with validation errors, **When** the teacher views the preview, **Then** error rows are highlighted with specific error messages (e.g., "Missing option B", "No correct answer marked").

---

### User Story 6 - Teacher Generates Distractors with AI (Priority: P3)

A teacher enters a target word and correct definition, and AI generates plausible distractor definitions.

**Why this priority**: Nice-to-have efficiency feature that reduces cognitive load of creating believable wrong answers.

**Independent Test**: Can be tested by entering a word and correct definition, clicking "Generate Distractors", and verifying 3 plausible Tamil definition options are returned.

**Acceptance Scenarios**:

1. **Given** a teacher creating a sorporul question, **When** they enter the target word and correct Tamil definition then click "Generate Distractors", **Then** the system generates 3 plausible Tamil definition options using AI.

2. **Given** AI-generated distractors, **When** the teacher reviews them, **Then** they can edit any distractor before saving the question.

3. **Given** AI generation fails or times out, **When** the teacher sees the error, **Then** they see a message "Could not generate distractors. Please enter manually." with manual entry fields enabled.

---

### Edge Cases

- What happens when a student searches their vocabulary bank with no matches? → Show "No words found matching your search" with option to clear search.
- What happens when the vocabulary bank is empty? → Show "You haven't saved any words yet. Start practicing to build your vocabulary!" with link to practice.
- What happens when CSV import contains duplicate words (same target word already exists)? → Flag as warning, allow teacher to skip or overwrite.
- What happens when a saved word's meaning is updated in the cache after save? → Saved words retain the meaning at time of save; no automatic updates.
- What happens when spaced repetition review has 50+ words due? → Load in batches of 10, show progress indicator, allow student to end session early.

---

## Requirements *(mandatory)*

### Functional Requirements

**Sorporul Practice**
- **FR-001**: System MUST display sorporul questions with a Tamil target word as the prompt and 4 Tamil definition options
- **FR-002**: System MUST integrate the shared WordGlossaryPopover component for tap/click word meaning lookup on any Tamil word
- **FR-003**: System MUST integrate the shared SaveWordButton component for saving words to vocabulary bank during practice
- **FR-004**: System MUST show correct answer and score summary after practice session completion
- **FR-005**: System MUST use the existing PracticeQuestionDTO format with section='sorporul'

**Vocabulary Bank**
- **FR-006**: System MUST display saved words in a searchable list with Tamil word, definitions, context, and save date
- **FR-007**: System MUST support text search filtering on word and definitions
- **FR-008**: System MUST allow deletion of saved words from vocabulary bank
- **FR-009**: System MUST use existing user_saved_words, word_sense_cache, and user_vocab_reviews tables

**Spaced Repetition Review**
- **FR-010**: System MUST display flashcard-style review with word shown first, definition revealed on action
- **FR-011**: System MUST support three review ratings: "again", "hard", "good"
- **FR-012**: System MUST update review scheduling via POST to existing /api/vocab/review endpoint
- **FR-013**: System MUST use the shared useVocabBank hook for all vocabulary operations

**Teacher Question Management**
- **FR-014**: System MUST provide a manual question entry form for sorporul questions
- **FR-015**: System MUST support CSV import with columns: target_word, option_a, option_b, option_c, option_d, correct_answer
- **FR-016**: System MUST validate CSV data and display row-level errors before import
- **FR-017**: System MUST provide AI-assisted distractor generation using Gemini API
- **FR-018**: System MUST apply Zod validation to all API input/output
- **FR-019**: System MUST apply rate limiting to AI-assisted generation (10 requests/minute per user)

### Key Entities

- **SorporulQuestion**: A word meaning MCQ with target Tamil word as prompt, 4 Tamil definition options, one marked correct. Extends the existing Question entity with section='sorporul'.
- **SavedWord**: (existing) Student's personal vocabulary item with word, meaning, context. Uses existing user_saved_words table.
- **VocabReview**: (existing) Spaced repetition scheduling data. Uses existing user_vocab_reviews table.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can complete a 10-question sorporul practice session in under 5 minutes
- **SC-002**: 90% of students successfully save their first word to vocabulary bank without errors
- **SC-003**: Students can find a saved word in their vocabulary bank within 10 seconds using search
- **SC-004**: Teachers can create and publish a sorporul question in under 2 minutes via manual entry
- **SC-005**: Teachers can import 20 questions via CSV in under 3 minutes including review
- **SC-006**: Spaced repetition review sessions show measurable improvement in word retention (tracked via review success rate over time)
