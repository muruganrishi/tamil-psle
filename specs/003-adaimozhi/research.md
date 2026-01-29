# Research: Adaimozhi Feature

**Feature**: 003-adaimozhi | **Date**: 2026-01-27

## Research Tasks Completed

### 1. Database Migration Pattern

**Decision**: Use `008_adaimozhi.sql` following sequential numbering
**Rationale**: Existing migrations numbered 001-007; next available is 008
**Alternatives Considered**:
- Timestamp-based naming: Rejected - inconsistent with existing pattern

**Pattern Observed**:
```sql
-- Migration structure from existing files:
-- 1. Header comment with description
-- 2. Table creation with constraints
-- 3. Index creation (performance)
-- 4. RLS policy setup
-- 5. Table comments for documentation
```

### 2. Attempt Answers Extension

**Decision**: Add nullable `adaimozhi_id` column with CHECK constraint for mutual exclusivity
**Rationale**:
- Keeps all answers in unified table for reporting
- CHECK constraint enforces exactly one of question_id OR adaimozhi_id is set
- Follows existing foreign key pattern

**Implementation**:
```sql
ALTER TABLE attempt_answers
  ADD COLUMN adaimozhi_id UUID REFERENCES adaimozhi(id) ON DELETE CASCADE;

ALTER TABLE attempt_answers
  ADD CONSTRAINT chk_question_or_adaimozhi
  CHECK (
    (question_id IS NOT NULL AND adaimozhi_id IS NULL) OR
    (question_id IS NULL AND adaimozhi_id IS NOT NULL)
  );
```

**Alternatives Considered**:
- Separate `adaimozhi_attempt_answers` table: Rejected - complicates unified reporting
- Polymorphic `content_id` + `content_type`: Rejected - loses FK integrity

### 3. Section Integration Strategy

**Decision**: Adaimozhi entries feed into existing `adaimozhi_echcham` section
**Rationale**:
- Spec clarification: "Merged into existing adaimozhi_echcham section"
- Database enum already has `adaimozhi_echcham`
- Provides question variety within section

**Implementation Approach**:
- Practice API queries BOTH `questions` (where section='adaimozhi_echcham') AND `adaimozhi` table
- Combines results into unified question array
- Each question type identified by presence of `adaimozhi_id` vs `question_id` in response

### 4. Distractor Selection Algorithm

**Decision**: DB-first with AI fallback
**Rationale**:
- Educational value: real epithet words as distractors
- Performance: single DB query for distractors
- Fallback: AI generates plausible alternatives when insufficient entries

**Algorithm**:
```
1. Query: SELECT DISTINCT missing_word FROM adaimozhi
          WHERE id != current_id
            AND missing_word != correct_answer
            AND status = 'published'
          ORDER BY RANDOM()
          LIMIT 3

2. If count < 3:
   a. Log AI fallback event (admin visibility only)
   b. Call Gemini to generate (3 - count) plausible distractors
   c. Combine with DB results

3. Shuffle all 4 options (correct + 3 distractors)
4. Assign labels A, B, C, D
```

### 5. Validator Pattern

**Decision**: Create `src/lib/validators/practice/adaimozhi.ts` following sorporul pattern
**Rationale**: Consistent with existing codebase; allows section-specific validation

**Required Schemas**:
- `AdaimozhiEntrySchema` - DB record validation
- `AdaimozhiCSVRowSchema` - CSV import validation
- `AdaimozhiQuestionResponseSchema` - API response shape
- `AdaimozhiCreateRequestSchema` - Manual entry request
- `AIGenerateRequestSchema` - AI assist request
- `AIGenerateResponseSchema` - AI assist response

### 6. AI Generation Prompt Pattern

**Decision**: Structured JSON output with explicit field mapping
**Rationale**:
- Matches existing Gemini integration patterns
- Zod validation on response
- Student-appropriate vocabulary (ages 10-12)

**Prompt Template**:
```
You are a Tamil language expert creating educational content for PSLE students (ages 10-12).

Generate {count} Tamil அடைமொழி (epithets/compound phrases) suitable for primary school learning.

For each phrase provide:
1. phrase_text: The phrase with a blank using "_____" (5 underscores)
2. missing_word: The correct word to fill the blank
3. complete_phrase: The full phrase without blank
4. meaning_ta: Simple Tamil explanation
5. meaning_en: Simple English translation

Respond in this exact JSON format:
{
  "suggestions": [
    {
      "phrase_text": "தாமரை _____",
      "missing_word": "கண்கள்",
      "complete_phrase": "தாமரை கண்கள்",
      "meaning_ta": "தாமரை போன்ற அழகிய கண்கள்",
      "meaning_en": "Beautiful eyes like lotus"
    }
  ]
}

Rules:
- Choose well-known epithets appropriate for children
- Use simple vocabulary in explanations
- Missing word should be culturally significant
```

### 7. Rate Limiting Strategy

**Decision**: 10 requests/minute per user for AI endpoints
**Rationale**: Constitution requirement for AI endpoints; controls costs

**Implementation**:
- Use existing rate limiting middleware pattern
- Track by user ID (from Supabase auth)
- Return 429 with retry-after header on limit

### 8. RLS Policy Design

**Decision**: Three-tier access (student/teacher/admin)
**Rationale**: Matches spec requirements FR-025, FR-026, FR-027

**Policies**:
```sql
-- Students: read published only
CREATE POLICY "Students can read published adaimozhi" ON adaimozhi
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Teachers: full CRUD on own content
CREATE POLICY "Teachers can manage own adaimozhi" ON adaimozhi
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Teachers can also read all published (for reference)
CREATE POLICY "Teachers can read all published" ON adaimozhi
  FOR SELECT
  TO authenticated
  USING (
    status = 'published' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Admins: full access
CREATE POLICY "Admins have full access" ON adaimozhi
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 9. CSV Import Format

**Decision**: 5 columns matching spec FR-014
**Rationale**: Simple structure, matches manual entry form fields

**CSV Format**:
```csv
phrase_with_blank,missing_word,complete_phrase,meaning_ta,meaning_en
"தாமரை _____","கண்கள்","தாமரை கண்கள்","தாமரை போன்ற அழகிய கண்கள்","Beautiful eyes like lotus"
```

**Validation**:
- Required: phrase_with_blank, missing_word, complete_phrase
- Optional: meaning_ta, meaning_en
- Duplicate detection: (missing_word, complete_phrase) combination
- Row-level error reporting

### 10. Component Reuse Strategy

**Decision**: Reuse shared components; create feature-specific components for adaimozhi display
**Rationale**: Spec requires reuse of QuestionShell, MCQOptions; custom display for phrase blanks

**Shared Components (READ-ONLY)**:
- `QuestionShell` - Question container
- `MCQOptions` - Option selection
- `ProgressIndicator` - Session progress
- `WordGlossaryPopover` - Word meanings

**New Components**:
- `AdaimozhiQuestionCard` - Renders phrase with blank, instruction text
- `AdaimozhiForm` - Teacher create/edit form
- `AdaimozhiPreview` - Live preview in form
- `CSVImportPreview` - Import validation display

---

## Unknowns Resolved

| Unknown | Resolution |
|---------|------------|
| Migration numbering | Sequential: 008_adaimozhi.sql |
| Attempt tracking extension | Add adaimozhi_id with CHECK constraint |
| Section integration | Merge into adaimozhi_echcham |
| Distractor source priority | DB-first, AI fallback with logging |
| Rate limiting | 10 req/min per user (constitution) |

---

**All research tasks complete. Ready for Phase 1: Design & Contracts.**
