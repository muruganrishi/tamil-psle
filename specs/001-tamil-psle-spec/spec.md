# Feature Specification: TamilPSLE Exam-Prep App

**Feature Branch**: `001-tamil-psle-spec`
**Created**: 2026-01-16
**Status**: Draft
**Input**: Tamil PSLE exam-prep app for Singapore students - 1-week MVP

---

## 1. Overview

### Problem Statement

Singapore Primary School Leaving Examination (PSLE) Tamil students lack an interactive, digitally-native practice tool tailored to the specific question formats and vocabulary challenges of the Tamil paper. Existing resources are static (paper-based or PDF), offer no immediate feedback, and provide no contextual help for vocabulary that students encounter. Teachers have limited visibility into individual student progress and struggle to create targeted practice assignments.

### Target Users

| Role | Description | Primary Needs |
|------|-------------|---------------|
| **Student** | Primary school students (ages 10-12) preparing for PSLE Tamil | Practice MCQ by section, get instant feedback, understand unfamiliar Tamil words in context |
| **Teacher** | Tamil tutors and school teachers | Create classes, assign targeted practice, monitor student progress and accuracy |
| **Admin** | Content managers and system administrators | Publish/approve questions, manage teacher accounts, oversee content quality |

### Success Criteria for 1-Week MVP

- **SC-001**: Students can complete a 10-question practice session in under 8 minutes
- **SC-002**: Hover/tap word meaning returns contextual definition within 2 seconds
- **SC-003**: Teachers can create a class and have students join within 5 minutes
- **SC-004**: 90% of students successfully complete their first practice session without assistance
- **SC-005**: Word meaning cache achieves 70%+ hit rate after initial population
- **SC-006**: Teachers can view class completion and accuracy reports within 3 clicks from dashboard

---

## 2. Scope

### In-Scope MVP Features

1. **Student Practice (MCQ) by Section**
   - A1 வேற்றுமை (Vetrumai) - Case markers
   - A2 செய்யுள்/பழமொழி (Seyyul/Pazhamozhi) - Poetry/Proverbs
   - A3 அடைமொழி/எச்சம் (Adaimozhi/Echcham) - Adjectives/Participles
   - A4 முன்னுணர்வுக் கருத்தறிதல் (Comprehension) - Passage-based questions
   - சொற்பொருள் (Sorporul) - Word meanings
   - ஒலி வேறுபாடு (Oli Verupaadu) - Sound differentiation including ர vs ற drills

2. **Contextual Word Meaning (Hover/Tap)**
   - Use 2-3 words before/after as context window (or full sentence if available)
   - Bilingual output: English + Tamil
   - User setting: EN only / TA only / BOTH
   - Cache meanings keyed by (normalized_word + context_window + language_mode)

3. **Teacher/Admin Views**
   - View student completion rates and accuracy by class/assignment
   - Filter by section, date range, student

4. **Question Ingestion MVP**
   - Manual single-question entry via form
   - Bulk CSV import for multiple questions
   - Optional "OCR Assist": Upload single question image → AI extracts structured MCQ → Teacher reviews → Save as draft → Publish

### Out-of-Scope (Explicitly Excluded)

- Full PDF-to-questionbank automated pipeline
- Full RAG-based conversational tutor
- Pronunciation scoring or audio features
- Public sharing or redistribution of uploaded exam papers
- Mobile native apps (web-first, mobile-responsive only)
- Real-time collaborative features
- Gamification (points, badges, leaderboards)
- Parent portal
- Payment/subscription features

---

## 3. User Scenarios & Testing

### User Story 1 - Student Practice Session (Priority: P1)

A student selects a practice section (e.g., வேற்றுமை), answers MCQ questions, and sees their score with correct answers highlighted.

**Why this priority**: Core value proposition - without practice, there is no app.

**Independent Test**: Can be fully tested by logging in as a student, selecting a section, answering 5 questions, and verifying score display. Delivers immediate study value.

**Acceptance Scenarios**:

1. **Given** a logged-in student on the practice page, **When** they select "வேற்றுமை" section and click "Start Practice", **Then** they see MCQ questions from that section with 4 options each.

2. **Given** a student viewing a question, **When** they select an answer and click "Next", **Then** their answer is recorded and the next question appears.

3. **Given** a student who has answered all questions, **When** they submit the practice session, **Then** they see a summary showing: total score, correct/incorrect for each question, and correct answers for missed questions.

4. **Given** a student on the results page, **When** they click "Try Again", **Then** they can start a new practice session with different questions from the same section.

---

### User Story 2 - Contextual Word Meaning (Priority: P1)

A student hovers over (desktop) or taps (mobile) any Tamil word in a question or passage to see its contextual meaning in their preferred language.

**Why this priority**: Critical differentiator - addresses vocabulary barrier that makes Tamil practice frustrating.

**Independent Test**: Can be tested by displaying any Tamil text, hovering/tapping a word, and verifying a meaning popover appears with bilingual definition.

**Acceptance Scenarios**:

1. **Given** a student viewing a question with Tamil text, **When** they hover over a Tamil word, **Then** a popover appears within 2 seconds showing the word's meaning in their preferred language setting.

2. **Given** a student with language setting "BOTH", **When** they hover over "பள்ளி" in context "நான் பள்ளி செல்கிறேன்", **Then** they see both English ("school") and Tamil (synonym/definition) meanings.

3. **Given** a word that has been looked up before with the same context, **When** a student hovers over it, **Then** the cached meaning is returned (no AI call).

4. **Given** rate limit exceeded for a student, **When** they hover over a word, **Then** they see a message "Please wait a moment before looking up more words" instead of an error.

---

### User Story 3 - Save Words for Review (Priority: P2)

A student can save unfamiliar words to a personal vocabulary list for later review.

**Why this priority**: Enhances learning retention but not essential for core practice flow.

**Independent Test**: Can be tested by saving a word from hover popover and verifying it appears in a "Saved Words" page.

**Acceptance Scenarios**:

1. **Given** a student viewing a word meaning popover, **When** they click "Save Word", **Then** the word with its meaning and context is added to their saved words list.

2. **Given** a student on their Saved Words page, **When** they view their list, **Then** they see all saved words with: Tamil word, meaning, original context, date saved.

3. **Given** a student with saved words, **When** they click "Remove" on a word, **Then** it is deleted from their list.

---

### User Story 4 - Teacher Class Management (Priority: P2)

A teacher creates a class with a unique join code. Students use this code to join and appear on the teacher's roster.

**Why this priority**: Enables teacher-student relationship required for assignments and progress tracking.

**Independent Test**: Can be tested by creating a class, sharing join code with a student account, having student join, and verifying student appears in class roster.

**Acceptance Scenarios**:

1. **Given** a logged-in teacher on the dashboard, **When** they click "Create Class" and enter a class name, **Then** a class is created with a unique 6-character alphanumeric join code.

2. **Given** a logged-in student, **When** they enter a valid join code on the "Join Class" page, **Then** they are added to that class and see it in their "My Classes" list.

3. **Given** an invalid or expired join code, **When** a student tries to join, **Then** they see an error message "Invalid join code. Please check with your teacher."

4. **Given** a teacher viewing their class, **When** they click on the class name, **Then** they see a roster of all students who have joined.

---

### User Story 5 - Teacher Creates Assignment (Priority: P2)

A teacher creates an assignment for their class by selecting a section and number of questions.

**Why this priority**: Enables targeted practice, but students can self-practice without assignments.

**Independent Test**: Can be tested by creating an assignment, logging in as a class student, and verifying the assignment appears and can be completed.

**Acceptance Scenarios**:

1. **Given** a teacher viewing their class, **When** they click "Create Assignment", **Then** they can select: section(s), number of questions, max attempts (1-3), due date (optional).

2. **Given** an assignment is created, **When** students in that class log in, **Then** they see the assignment on their dashboard with section, question count, and due date.

3. **Given** a student views an assignment, **When** they click "Start", **Then** they begin a practice session with questions matching the assignment criteria.

4. **Given** a student completes an assignment, **When** they submit, **Then** the assignment is marked complete and their score is recorded.

---

### User Story 6 - Teacher Views Results (Priority: P2)

A teacher views completion rates and accuracy for their class and individual students.

**Why this priority**: Provides teaching insight but not required for core student practice.

**Independent Test**: Can be tested by having students complete practice sessions, then viewing results dashboard as teacher.

**Acceptance Scenarios**:

1. **Given** a teacher on their class page, **When** they click "View Results", **Then** they see a summary table: student name, assignments completed, average accuracy.

2. **Given** a teacher viewing results, **When** they click on a student's name, **Then** they see that student's detailed history: each attempt, section, score, date.

3. **Given** a teacher viewing results, **When** they filter by section (e.g., "வேற்றுமை"), **Then** they see only attempts for that section.

---

### User Story 7 - Admin Question Entry (Priority: P3)

An admin manually enters questions via a form or imports via CSV.

**Why this priority**: Content must exist for students to practice, but initial seeding can be done before launch.

**Independent Test**: Can be tested by entering a question, publishing it, and verifying it appears in student practice.

**Acceptance Scenarios**:

1. **Given** an admin on the question management page, **When** they click "Add Question", **Then** they see a form with: section dropdown, question text, 4 options, correct answer indicator, optional passage link.

2. **Given** an admin fills the question form with valid data, **When** they click "Save as Draft", **Then** the question is saved but not visible to students.

3. **Given** a draft question, **When** an admin clicks "Publish", **Then** the question becomes available in the student practice pool for that section.

4. **Given** an admin with a properly formatted CSV file, **When** they upload it on the import page, **Then** questions are created as drafts with a preview showing count and any validation errors.

---

### User Story 8 - OCR Assist for Question Entry (Priority: P3)

An admin uploads an image of a single question. AI extracts structured MCQ data for review before saving.

**Why this priority**: Nice-to-have efficiency feature; manual entry is sufficient for MVP.

**Independent Test**: Can be tested by uploading a clear question image and verifying extracted fields populate the form.

**Acceptance Scenarios**:

1. **Given** an admin on the question entry page, **When** they click "OCR Assist" and upload a clear image of a Tamil MCQ, **Then** the system extracts: question text, 4 options, and suggested correct answer.

2. **Given** extracted OCR data, **When** the admin reviews it, **Then** they can edit any field before saving as draft.

3. **Given** an unclear or non-question image, **When** OCR cannot extract valid data, **Then** the admin sees "Could not extract question. Please enter manually or try a clearer image."

---

### Edge Cases

- What happens when a student has no internet during practice? → Show "Connection lost. Your progress is saved. Please reconnect to continue."
- What happens when a section has fewer questions than requested? → Return all available questions with a note "X questions available" if less than requested.
- What happens when the word meaning AI is unavailable? → Show "Meaning temporarily unavailable. Please try again."
- How does system handle duplicate word lookups within same context? → Return cached value; no duplicate cache entries.
- What happens when a teacher deletes a class with active assignments? → Block deletion with message "Remove or complete active assignments before deleting class."
- What happens when a student tries to join the same class twice? → Show "You are already a member of this class."
- What happens when a student has used all assignment attempts? → Show assignment as completed with all attempts listed; "Start" button disabled with message "All attempts used."

---

## 4. Requirements

### Functional Requirements

**Authentication & Authorization**
- **FR-001**: System MUST authenticate users via email/password with email verification
- **FR-002**: System MUST support three roles: student, teacher, admin
- **FR-003**: System MUST allow admins to grant teacher role to existing users
- **FR-033**: System MUST assign student role by default to all new user signups

**Student Practice**
- **FR-004**: System MUST display MCQ questions with exactly 4 options per question
- **FR-005**: System MUST support 6 question sections: வேற்றுமை, செய்யுள்/பழமொழி, அடைமொழி/எச்சம், முன்னுணர்வுக் கருத்தறிதல், சொற்பொருள், ஒலி வேறுபாடு
- **FR-006**: System MUST record each practice attempt with: user, section, answers, score, timestamp
- **FR-007**: System MUST show correct answers after practice session completion
- **FR-008**: System MUST only show published questions to students
- **FR-030**: System MUST select questions adaptively: (1) prioritize questions student previously answered incorrectly, (2) then unseen questions, (3) then random from remaining pool

**Word Meaning**
- **FR-009**: System MUST provide contextual word meaning on hover (desktop) or tap (mobile) for any Tamil word
- **FR-010**: System MUST use 2-3 surrounding words as context for meaning generation
- **FR-011**: System MUST support three language modes: English only, Tamil only, Both
- **FR-012**: System MUST cache word meanings keyed by (normalized_word + context_hash + language_mode)
- **FR-013**: System MUST rate-limit meaning requests to 60 per minute per user
- **FR-014**: System MUST allow students to save words to a personal vocabulary list

**Class Management**
- **FR-015**: System MUST generate unique 6-character alphanumeric join codes for classes
- **FR-016**: System MUST allow students to join classes via join code
- **FR-017**: System MUST allow teachers to view all students in their classes

**Assignments**
- **FR-018**: System MUST allow teachers to create assignments specifying: section(s), question count, optional due date, max attempts (1-3, default 1)
- **FR-019**: System MUST display pending assignments to students in the assigned class
- **FR-020**: System MUST record assignment completion with score
- **FR-031**: System MUST enforce max attempts per assignment; student cannot exceed configured limit
- **FR-032**: System MUST display all student attempts to teacher (not just best/latest)

**Teacher Analytics**
- **FR-021**: System MUST display class-level completion and accuracy statistics
- **FR-022**: System MUST display individual student attempt history
- **FR-023**: System MUST support filtering results by section and date range

**Content Management**
- **FR-024**: System MUST allow admins to create questions with: section, question text, 4 options, correct answer, optional passage reference
- **FR-025**: System MUST support question states: draft, published
- **FR-026**: System MUST allow bulk question import via CSV with validation
- **FR-027**: System MUST provide OCR-assisted question extraction from images with 10 requests/minute rate limit

**Passages (for Comprehension)**
- **FR-028**: System MUST support passages that can be linked to multiple questions
- **FR-029**: System MUST display passage text above questions during comprehension practice

### Key Entities

- **User/Profile**: Represents authenticated users with role (student/teacher/admin) and preferences (UI language)
- **Class**: A group created by a teacher; contains members (students) and assignments
- **Question**: An MCQ item belonging to a section, with options and correct answer; may reference a passage
- **Passage**: Tamil text block used for comprehension questions; can be linked to multiple questions
- **Attempt**: A student's answer record for a practice session; includes score and timestamp
- **Assignment**: Teacher-created practice task for a class; specifies section and question count
- **WordSenseCache**: Cached AI-generated meanings keyed by word + context + language
- **SavedWord**: Student's personal vocabulary item with word, meaning, context, and save date

---

## 5. Data Model (Supabase Postgres)

### Tables & Key Columns

```
profiles
├── id (uuid, PK, references auth.users)
├── role (enum: student, teacher, admin) DEFAULT 'student'
├── display_name (text)
├── ui_language (enum: en, ta, both) DEFAULT 'both'
├── created_at, updated_at
└── INDEX: role

classes
├── id (uuid, PK)
├── teacher_id (uuid, FK → profiles)
├── name (text)
├── join_code (text, unique, 6 chars)
├── created_at
└── INDEX: teacher_id, join_code

class_members
├── id (uuid, PK)
├── class_id (uuid, FK → classes)
├── student_id (uuid, FK → profiles)
├── joined_at
└── UNIQUE: (class_id, student_id)
└── INDEX: class_id, student_id

passages
├── id (uuid, PK)
├── title (text)
├── content (text) -- Tamil passage text
├── created_by (uuid, FK → profiles)
├── status (enum: draft, published)
├── created_at, updated_at
└── INDEX: status

questions
├── id (uuid, PK)
├── section (enum: vetrumai, seyyul_pazhamozhi, adaimozhi_echcham, comprehension, sorporul, oli_verupaadu)
├── passage_id (uuid, FK → passages, nullable)
├── question_text (text) -- Tamil question
├── status (enum: draft, published)
├── created_by (uuid, FK → profiles)
├── created_at, updated_at
└── INDEX: section, status, (section, status)

question_options
├── id (uuid, PK)
├── question_id (uuid, FK → questions)
├── option_label (char: A, B, C, D)
├── option_text (text) -- Tamil option
├── is_correct (boolean)
└── INDEX: question_id

attempts
├── id (uuid, PK)
├── user_id (uuid, FK → profiles)
├── assignment_id (uuid, FK → assignments, nullable)
├── section (enum)
├── started_at (timestamptz)
├── completed_at (timestamptz)
├── score (int)
├── total_questions (int)
└── INDEX: user_id, (user_id, section), assignment_id

attempt_answers
├── id (uuid, PK)
├── attempt_id (uuid, FK → attempts)
├── question_id (uuid, FK → questions)
├── selected_option (char: A, B, C, D)
├── is_correct (boolean)
└── INDEX: attempt_id

assignments
├── id (uuid, PK)
├── class_id (uuid, FK → classes)
├── created_by (uuid, FK → profiles)
├── title (text)
├── sections (enum[]) -- array of sections
├── question_count (int)
├── max_attempts (int, 1-3) DEFAULT 1
├── due_date (timestamptz, nullable)
├── created_at
└── INDEX: class_id

user_saved_words
├── id (uuid, PK)
├── user_id (uuid, FK → profiles)
├── word (text) -- normalized Tamil word
├── context (text) -- surrounding text
├── meaning_en (text)
├── meaning_ta (text)
├── saved_at (timestamptz)
└── INDEX: user_id
└── UNIQUE: (user_id, word, context)

word_sense_cache
├── id (uuid, PK)
├── word_normalized (text)
├── context_hash (text) -- hash of context window
├── language_mode (enum: en, ta, both)
├── meaning_en (text, nullable)
├── meaning_ta (text, nullable)
├── created_at
└── UNIQUE: (word_normalized, context_hash, language_mode)
└── INDEX: (word_normalized, context_hash, language_mode)
```

---

## 6. Security & RLS Summary

| Table | Student | Teacher | Admin |
|-------|---------|---------|-------|
| **profiles** | Read own | Read own + class members | Read/Write all |
| **classes** | Read joined | Read/Write own | Read/Write all |
| **class_members** | Read own memberships | Read own class members | Read/Write all |
| **passages** | Read published | Read published + own drafts | Read/Write all |
| **questions** | Read published | Read published + own drafts | Read/Write all |
| **question_options** | Read (via question) | Read (via question) | Read/Write all |
| **attempts** | Read/Write own | Read own class students | Read all |
| **attempt_answers** | Read/Write own | Read own class students | Read all |
| **assignments** | Read assigned to joined classes | Read/Write own classes | Read/Write all |
| **user_saved_words** | Read/Write own | Read/Write own | Read/Write all |
| **word_sense_cache** | Read only | Read only | Read/Write all |

### Key RLS Principles

1. **Students see only published content** - Questions and passages with status='published'
2. **Students own their data** - Only access their own attempts, saved words, class memberships
3. **Teachers manage their scope** - Own classes, own assignments, own drafts; can view their students' progress
4. **Admins have full access** - Manage all content, users, and system data
5. **No cross-class visibility** - Teachers cannot see other teachers' classes or students

---

## 7. API Surface (Route Handlers)

### POST /api/meaning
**Purpose**: Get contextual meaning for a Tamil word
**Auth**: Required (any role)
**Rate Limit**: 60/min per user

Request:
```json
{
  "word": "பள்ளி",
  "context": "நான் பள்ளி செல்கிறேன்",
  "language_mode": "both"
}
```

Response (200):
```json
{
  "word": "பள்ளி",
  "meaning_en": "school",
  "meaning_ta": "கல்வி நிலையம்",
  "cached": true
}
```

---

### GET /api/questions
**Purpose**: Fetch questions for practice
**Auth**: Required (any role)
**Query Params**: section (required), limit (optional, default 10), exclude_ids (optional)

Response (200):
```json
{
  "questions": [
    {
      "id": "uuid",
      "section": "vetrumai",
      "question_text": "சரியான வேற்றுமை உருபைத் தேர்ந்தெடுக்கவும்",
      "options": [
        { "label": "A", "text": "ஐ" },
        { "label": "B", "text": "ஆல்" },
        { "label": "C", "text": "கு" },
        { "label": "D", "text": "இல்" }
      ],
      "passage": null
    }
  ],
  "total_available": 45
}
```

---

### POST /api/attempts
**Purpose**: Submit a completed practice attempt
**Auth**: Required (student)

Request:
```json
{
  "section": "vetrumai",
  "assignment_id": "uuid or null",
  "answers": [
    { "question_id": "uuid", "selected_option": "A" },
    { "question_id": "uuid", "selected_option": "C" }
  ]
}
```

Response (201):
```json
{
  "attempt_id": "uuid",
  "score": 8,
  "total": 10,
  "results": [
    { "question_id": "uuid", "correct": true, "correct_answer": "A" },
    { "question_id": "uuid", "correct": false, "correct_answer": "B" }
  ]
}
```

---

### POST /api/saved-words
**Purpose**: Save a word to personal vocabulary
**Auth**: Required (student)

Request:
```json
{
  "word": "பள்ளி",
  "context": "நான் பள்ளி செல்கிறேன்",
  "meaning_en": "school",
  "meaning_ta": "கல்வி நிலையம்"
}
```

Response (201):
```json
{
  "id": "uuid",
  "saved_at": "2026-01-16T10:30:00Z"
}
```

---

### POST /api/classes
**Purpose**: Create a new class
**Auth**: Required (teacher)

Request:
```json
{
  "name": "P6 Tamil 2026"
}
```

Response (201):
```json
{
  "id": "uuid",
  "name": "P6 Tamil 2026",
  "join_code": "ABC123"
}
```

---

### POST /api/classes/join
**Purpose**: Join a class via code
**Auth**: Required (student)

Request:
```json
{
  "join_code": "ABC123"
}
```

Response (200):
```json
{
  "class_id": "uuid",
  "class_name": "P6 Tamil 2026",
  "teacher_name": "Mrs. Lakshmi"
}
```

---

### POST /api/assignments
**Purpose**: Create an assignment
**Auth**: Required (teacher)

Request:
```json
{
  "class_id": "uuid",
  "title": "Week 1 - Vetrumai Practice",
  "sections": ["vetrumai"],
  "question_count": 10,
  "max_attempts": 2,
  "due_date": "2026-01-23T23:59:00Z"
}
```

Response (201):
```json
{
  "id": "uuid",
  "title": "Week 1 - Vetrumai Practice",
  "max_attempts": 2,
  "created_at": "2026-01-16T10:00:00Z"
}
```

---

### GET /api/assignments/:id
**Purpose**: Get assignment details with completion status
**Auth**: Required (student in class or teacher owner)

Response (200):
```json
{
  "id": "uuid",
  "title": "Week 1 - Vetrumai Practice",
  "sections": ["vetrumai"],
  "question_count": 10,
  "max_attempts": 2,
  "attempts_used": 1,
  "due_date": "2026-01-23T23:59:00Z",
  "can_retry": true,
  "attempts": [
    { "attempt_id": "uuid", "score": 7, "total": 10, "completed_at": "2026-01-17T14:30:00Z" }
  ]
}
```

---

### POST /api/admin/questions/import-csv
**Purpose**: Bulk import questions from CSV
**Auth**: Required (admin)

Request: multipart/form-data with CSV file

Response (200):
```json
{
  "imported": 25,
  "errors": [
    { "row": 12, "error": "Missing correct answer indicator" }
  ],
  "status": "Questions imported as drafts"
}
```

---

### POST /api/admin/ocr-assist
**Purpose**: Extract MCQ from image via AI
**Auth**: Required (admin)
**Rate Limit**: 10/min per user

Request: multipart/form-data with image file

Response (200):
```json
{
  "extracted": true,
  "question_text": "சரியான வேற்றுமை உருபைத் தேர்ந்தெடுக்கவும்",
  "options": [
    { "label": "A", "text": "ஐ" },
    { "label": "B", "text": "ஆல்" },
    { "label": "C", "text": "கு" },
    { "label": "D", "text": "இல்" }
  ],
  "suggested_correct": "A",
  "confidence": "high"
}
```

---

## 8. UI/UX Pages & Components

### Student Pages

| Page | Route | Key Features |
|------|-------|--------------|
| Dashboard | `/student` | List assignments, quick-start practice by section, saved words count |
| Practice | `/student/practice/[section]` | MCQ card flow, progress indicator, hover-for-meaning |
| Results | `/student/results/[attemptId]` | Score summary, review answers, option to retry |
| Saved Words | `/student/saved-words` | Vocabulary list with search, delete functionality |
| My Classes | `/student/classes` | List joined classes, join new class form |

### Teacher Pages

| Page | Route | Key Features |
|------|-------|--------------|
| Dashboard | `/teacher` | Classes overview, recent activity, quick create |
| Class Detail | `/teacher/classes/[id]` | Student roster, assignments list, results summary |
| Create Assignment | `/teacher/classes/[id]/assignments/new` | Section picker, question count, due date |
| Results | `/teacher/classes/[id]/results` | Completion/accuracy table, filters, student drill-down |
| My Drafts | `/teacher/drafts` | View own draft questions (if teacher creates content) |

### Admin Pages

| Page | Route | Key Features |
|------|-------|--------------|
| Dashboard | `/admin` | Stats overview, recent content, pending reviews |
| Questions | `/admin/questions` | List all questions, filter by section/status, edit/publish |
| Add Question | `/admin/questions/new` | Manual entry form, OCR assist option |
| Import | `/admin/questions/import` | CSV upload with preview and validation |
| Users | `/admin/users` | User list, role management (grant teacher) |

### Key Components

| Component | Purpose |
|-----------|---------|
| `TokenizedText` | Renders Tamil text with each word wrapped for hover/tap detection |
| `MeaningPopover` | Floating popover showing word meaning on hover/tap with save button |
| `MCQCard` | Displays question text, 4 option buttons, handles selection state |
| `PassageDisplay` | Renders passage text with TokenizedText for comprehension questions |
| `AssignmentTable` | Teacher view: columns for student, completion %, score, date |
| `ResultsSummary` | Student view: score, breakdown, correct answers reveal |
| `SectionPicker` | Radio/checkbox group for selecting practice sections |
| `LanguageToggle` | Settings toggle for EN/TA/BOTH meaning display |

---

## 9. AI Design (Gemini)

### Contextual Word Meaning

**Prompt Template**:
```
You are a Tamil-English bilingual dictionary assistant for Singapore primary school students.

Given a Tamil word and its surrounding context, provide a clear, student-friendly definition.

Word: {word}
Context: {context}
Language: {language_mode}

Respond in this exact JSON format:
{
  "word": "<the input word>",
  "meaning_en": "<English definition, 1-2 sentences, simple vocabulary>",
  "meaning_ta": "<Tamil definition using simpler synonyms>"
}

Rules:
- Use vocabulary appropriate for ages 10-12
- If word has multiple meanings, use context to select the most relevant
- For meaning_en: Include part of speech if helpful (noun, verb, etc.)
- For meaning_ta: Provide a simpler Tamil synonym or brief explanation
- If language_mode is "en", set meaning_ta to null
- If language_mode is "ta", set meaning_en to null
- Never include pronunciation guides or audio references
```

**Response Schema (Zod)**:
```typescript
const WordMeaningSchema = z.object({
  word: z.string(),
  meaning_en: z.string().nullable(),
  meaning_ta: z.string().nullable()
});
```

### OCR Assist

**Prompt Template**:
```
You are an OCR assistant for Tamil exam questions. Extract the MCQ structure from this image.

Respond in this exact JSON format:
{
  "extracted": true,
  "question_text": "<Tamil question text>",
  "options": [
    { "label": "A", "text": "<option A text>" },
    { "label": "B", "text": "<option B text>" },
    { "label": "C", "text": "<option C text>" },
    { "label": "D", "text": "<option D text>" }
  ],
  "suggested_correct": "<A, B, C, or D based on any marking in image>",
  "confidence": "<high, medium, or low>"
}

Rules:
- Extract Tamil text accurately, preserving all characters
- If answer is marked/circled in image, indicate in suggested_correct
- If no marking visible, set suggested_correct to null
- Set confidence to "low" if text is unclear or partially visible
- If not a valid MCQ image, return: { "extracted": false, "error": "reason" }
```

**Response Schema (Zod)**:
```typescript
const OCRResultSchema = z.discriminatedUnion("extracted", [
  z.object({
    extracted: z.literal(true),
    question_text: z.string(),
    options: z.array(z.object({
      label: z.enum(["A", "B", "C", "D"]),
      text: z.string()
    })).length(4),
    suggested_correct: z.enum(["A", "B", "C", "D"]).nullable(),
    confidence: z.enum(["high", "medium", "low"])
  }),
  z.object({
    extracted: z.literal(false),
    error: z.string()
  })
]);
```

### Cache Strategy

1. **Word Meaning Cache**:
   - Key: `SHA256(normalized_word + context_window + language_mode)`
   - Storage: `word_sense_cache` table
   - TTL: No expiration (meanings don't change)
   - Lookup order: DB cache → Gemini API → Store in cache → Return

2. **Rate Limiting**:
   - Word meaning: 60 requests/minute per user (sliding window)
   - OCR assist: 10 requests/minute per user (sliding window)
   - Implementation: Store request timestamps in user session or rate limit middleware

3. **Cost Controls**:
   - Monitor daily API spend
   - Alert at 80% of daily budget
   - Hard cap at daily limit (return cached-only mode)
   - Log all API calls with token counts for cost tracking

---

## 10. Testing Plan (Playwright)

### Required Smoke Tests Before Deploy

| # | Test Name | Steps | Success Criteria |
|---|-----------|-------|------------------|
| 1 | **Student Login Flow** | Navigate to login → Enter credentials → Submit | Redirects to student dashboard, shows user name |
| 2 | **Practice Session Complete** | Login as student → Select section → Answer 5 questions → Submit | Results page shows score, correct answers visible |
| 3 | **Hover Word Meaning** | During practice → Hover Tamil word → Wait for popover | Popover appears within 3 seconds with meaning text |
| 4 | **Save Word** | Hover word → Click "Save" in popover → Navigate to Saved Words | Word appears in saved words list |
| 5 | **Class Join** | Login as student → Enter valid join code → Submit | Success message, class appears in My Classes |
| 6 | **Teacher Create Class** | Login as teacher → Create class → Copy join code | Class created, join code displayed (6 chars) |
| 7 | **Assignment Completion** | Login as student with assignment → Start assignment → Complete → Submit | Assignment marked complete, score recorded |
| 8 | **Admin Question Publish** | Login as admin → Create draft question → Publish | Question status changes to published |

### Test Data Requirements

- Seed database with: 1 admin, 1 teacher, 2 students
- Seed at least 10 published questions per section
- Pre-create 1 class with 1 student member
- Pre-create 1 assignment for that class

---

## Assumptions

1. **Authentication**: Email/password auth is sufficient for MVP; SSO/OAuth deferred
2. **Language**: UI chrome is in English; Tamil content is for practice materials only
3. **Question Format**: All questions are single-correct MCQ with exactly 4 options
4. **Class Size**: Classes expected to have <50 students for MVP (no pagination required initially)
5. **Concurrent Users**: MVP targets <100 concurrent users
6. **Browser Support**: Modern browsers (Chrome, Safari, Firefox, Edge - last 2 versions)
7. **Mobile**: Responsive web design; no native app for MVP
8. **Content Source**: Initial question bank seeded by admin; teachers focus on assignments not content creation

---

## Constraints

1. **Privacy**: No public sharing of exam content; private by default
2. **Data Retention**: Student data retained indefinitely for learning analytics (within Singapore PDPA guidelines)
3. **AI Usage**: All AI calls server-side only; keys never exposed to client
4. **Budget**: Gemini API usage capped to control costs
5. **Timeline**: 1-week MVP scope; all out-of-scope items strictly deferred

---

---

## Clarifications

### Session 2026-01-16

- Q: How are questions selected/ordered within a practice session? → A: Adaptive selection - prioritize questions the student previously answered incorrectly, then fill with unseen questions, then random from remaining pool.
- Q: Can students retry assignments after completion? → A: Teacher-configurable (1-3 attempts per assignment); teacher sees all attempts with scores.
- Q: What role do new users get on signup? → A: All new signups default to student; admin promotes to teacher via user management.

---

**Version**: 1.0.1 | **Last Updated**: 2026-01-16
