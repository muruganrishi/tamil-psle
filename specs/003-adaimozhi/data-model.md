# Data Model: Adaimozhi Feature

**Feature**: 003-adaimozhi | **Date**: 2026-01-27

## Entity Relationship Overview

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   profiles   │       │    adaimozhi     │       │   attempts   │
│──────────────│       │──────────────────│       │──────────────│
│ id (PK)      │◄──────│ created_by (FK)  │       │ id (PK)      │
│ role         │       │ id (PK)          │       │ user_id (FK) │
│ display_name │       │ phrase_text      │       │ section      │
└──────────────┘       │ missing_word     │       │ score        │
                       │ complete_phrase  │       └──────┬───────┘
                       │ meaning_ta       │              │
                       │ meaning_en       │              │
                       │ status           │              │
                       │ created_at       │              │
                       │ updated_at       │              ▼
                       └────────┬─────────┘       ┌──────────────────┐
                                │                 │  attempt_answers │
                                │                 │──────────────────│
                                │                 │ id (PK)          │
                                └────────────────►│ attempt_id (FK)  │
                                                  │ question_id (FK) │ ← XOR
                                                  │ adaimozhi_id(FK) │ ← XOR
                                                  │ selected_option  │
                                                  │ is_correct       │
                                                  └──────────────────┘
```

## Tables

### adaimozhi (NEW)

Tamil epithet/compound phrase entries for fill-in-blank practice.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `phrase_text` | TEXT | NOT NULL | Phrase with blank marker (e.g., "தாமரை _____") |
| `missing_word` | TEXT | NOT NULL | Correct word to fill blank |
| `complete_phrase` | TEXT | NOT NULL | Full phrase without blank |
| `meaning_ta` | TEXT | NULLABLE | Tamil explanation |
| `meaning_en` | TEXT | NULLABLE | English translation |
| `status` | TEXT | NOT NULL, DEFAULT 'draft', CHECK IN ('draft', 'published') | Publication status |
| `created_by` | UUID | FK → auth.users(id), NOT NULL | Content creator |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Indexes**:
- `idx_adaimozhi_status` ON (status) - Filter by publication status
- `idx_adaimozhi_created_by` ON (created_by) - Teacher's content lookup
- `idx_adaimozhi_missing_word_published` ON (missing_word) WHERE status='published' - Distractor queries
- `idx_adaimozhi_unique_entry` UNIQUE ON (missing_word, complete_phrase) - Duplicate prevention

**Constraints**:
- `chk_adaimozhi_status` CHECK (status IN ('draft', 'published'))
- Unique constraint on (missing_word, complete_phrase) per FR-014a

### attempt_answers (EXTENDED)

Existing table extended to support adaimozhi questions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `adaimozhi_id` | UUID | FK → adaimozhi(id), NULLABLE | **NEW**: Link to adaimozhi entry |

**New Constraint**:
```sql
ALTER TABLE attempt_answers
  ADD CONSTRAINT chk_question_or_adaimozhi
  CHECK (
    (question_id IS NOT NULL AND adaimozhi_id IS NULL) OR
    (question_id IS NULL AND adaimozhi_id IS NOT NULL)
  );
```

**New Index**:
- `idx_attempt_answers_adaimozhi` ON (adaimozhi_id) WHERE adaimozhi_id IS NOT NULL

## RLS Policies

### adaimozhi table

```sql
-- Enable RLS
ALTER TABLE adaimozhi ENABLE ROW LEVEL SECURITY;

-- Policy 1: Students can read published entries only
CREATE POLICY "students_read_published" ON adaimozhi
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Policy 2: Teachers can read all published + their own drafts
CREATE POLICY "teachers_read_own_and_published" ON adaimozhi
  FOR SELECT
  TO authenticated
  USING (
    status = 'published' OR
    (auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    ))
  );

-- Policy 3: Teachers can insert their own content
CREATE POLICY "teachers_insert_own" ON adaimozhi
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Policy 4: Teachers can update their own content
CREATE POLICY "teachers_update_own" ON adaimozhi
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Policy 5: Teachers can delete their own draft content
CREATE POLICY "teachers_delete_own_drafts" ON adaimozhi
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by AND
    status = 'draft' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Policy 6: Admins have full access
CREATE POLICY "admins_full_access" ON adaimozhi
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

## State Transitions

### Adaimozhi Entry Lifecycle

```
                  ┌─────────────┐
                  │   CREATE    │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
          ┌───────│    draft    │◄──────┐
          │       └──────┬──────┘       │
          │              │              │
          │         PUBLISH         UNPUBLISH
          │              │              │
          │              ▼              │
        DELETE    ┌─────────────┐       │
          │       │  published  │───────┘
          │       └─────────────┘
          │
          ▼
     [DELETED]
```

**State Rules**:
- New entries start as `draft`
- Only owner or admin can publish (draft → published)
- Only admin can unpublish (published → draft)
- Only drafts can be deleted
- Published content remains visible until unpublished

## Validation Rules

### Required Fields
- `phrase_text`: Non-empty, must contain blank marker "_____"
- `missing_word`: Non-empty Tamil text
- `complete_phrase`: Non-empty, should equal phrase_text with blank replaced by missing_word
- `created_by`: Set automatically to auth.uid()

### Optional Fields
- `meaning_ta`: Tamil explanation (recommended for learning)
- `meaning_en`: English translation (recommended for bilingual support)

### Business Rules
- `complete_phrase` should be derived: `phrase_text.replace('_____', missing_word)`
- Blank marker is exactly 5 underscores: `_____`
- Duplicate entries rejected: same (missing_word, complete_phrase) combination

## Query Patterns

### Fetch Questions with Distractors

```sql
-- 1. Get random published entries for practice session
WITH selected_entries AS (
  SELECT * FROM adaimozhi
  WHERE status = 'published'
  ORDER BY RANDOM()
  LIMIT :limit
)

-- 2. For each entry, get distractors (in application code)
SELECT DISTINCT missing_word
FROM adaimozhi
WHERE id != :entry_id
  AND missing_word != :correct_word
  AND status = 'published'
ORDER BY RANDOM()
LIMIT 3;
```

### Teacher Content List

```sql
SELECT id, phrase_text, missing_word, status, created_at, updated_at
FROM adaimozhi
WHERE created_by = auth.uid()
ORDER BY updated_at DESC;
```

### Check for Duplicates

```sql
SELECT EXISTS (
  SELECT 1 FROM adaimozhi
  WHERE missing_word = :missing_word
    AND complete_phrase = :complete_phrase
) AS is_duplicate;
```

---

## Migration Script

File: `supabase/migrations/008_adaimozhi.sql`

```sql
-- Migration: 008_adaimozhi
-- Feature: Adaimozhi (அடைமொழி / Epithets & Compound Phrases)
-- Date: 2026-01-27

-- =============================================================================
-- 1. CREATE ADAIMOZHI TABLE
-- =============================================================================

CREATE TABLE adaimozhi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_text TEXT NOT NULL,
  missing_word TEXT NOT NULL,
  complete_phrase TEXT NOT NULL,
  meaning_ta TEXT,
  meaning_en TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uniqueness constraint for duplicate prevention
ALTER TABLE adaimozhi
  ADD CONSTRAINT uq_adaimozhi_entry UNIQUE (missing_word, complete_phrase);

-- Comments
COMMENT ON TABLE adaimozhi IS 'Tamil epithet/compound phrase entries for fill-in-blank practice (PSLE Section A3)';
COMMENT ON COLUMN adaimozhi.phrase_text IS 'Phrase with blank marker using 5 underscores: _____';
COMMENT ON COLUMN adaimozhi.missing_word IS 'The correct word to fill the blank';
COMMENT ON COLUMN adaimozhi.complete_phrase IS 'Full phrase without blank marker';

-- =============================================================================
-- 2. CREATE INDEXES
-- =============================================================================

CREATE INDEX idx_adaimozhi_status ON adaimozhi(status);
CREATE INDEX idx_adaimozhi_created_by ON adaimozhi(created_by);
CREATE INDEX idx_adaimozhi_missing_word_published ON adaimozhi(missing_word) WHERE status = 'published';

-- =============================================================================
-- 3. ENABLE RLS AND CREATE POLICIES
-- =============================================================================

ALTER TABLE adaimozhi ENABLE ROW LEVEL SECURITY;

-- Students: read published only
CREATE POLICY "students_read_published" ON adaimozhi
  FOR SELECT TO authenticated
  USING (status = 'published');

-- Teachers: read published + own drafts
CREATE POLICY "teachers_read_own_and_published" ON adaimozhi
  FOR SELECT TO authenticated
  USING (
    status = 'published' OR
    (auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    ))
  );

-- Teachers: insert own
CREATE POLICY "teachers_insert_own" ON adaimozhi
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Teachers: update own
CREATE POLICY "teachers_update_own" ON adaimozhi
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Teachers: delete own drafts
CREATE POLICY "teachers_delete_own_drafts" ON adaimozhi
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by AND status = 'draft' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Admins: full access
CREATE POLICY "admins_full_access" ON adaimozhi
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================================================
-- 4. EXTEND ATTEMPT_ANSWERS TABLE
-- =============================================================================

ALTER TABLE attempt_answers
  ADD COLUMN adaimozhi_id UUID REFERENCES adaimozhi(id) ON DELETE CASCADE;

-- Mutual exclusivity constraint: exactly one of question_id or adaimozhi_id
ALTER TABLE attempt_answers
  ADD CONSTRAINT chk_question_or_adaimozhi
  CHECK (
    (question_id IS NOT NULL AND adaimozhi_id IS NULL) OR
    (question_id IS NULL AND adaimozhi_id IS NOT NULL)
  );

-- Index for adaimozhi answers
CREATE INDEX idx_attempt_answers_adaimozhi ON attempt_answers(adaimozhi_id)
  WHERE adaimozhi_id IS NOT NULL;

COMMENT ON COLUMN attempt_answers.adaimozhi_id IS 'FK to adaimozhi table; mutually exclusive with question_id';

-- =============================================================================
-- 5. UPDATE TRIGGER FOR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_adaimozhi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_adaimozhi_updated_at
  BEFORE UPDATE ON adaimozhi
  FOR EACH ROW
  EXECUTE FUNCTION update_adaimozhi_updated_at();
```

---

**Version**: 1.0.0 | **Last Updated**: 2026-01-27
