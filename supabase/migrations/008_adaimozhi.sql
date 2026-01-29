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

-- Make question_id nullable to support adaimozhi-only answers
ALTER TABLE attempt_answers
  ALTER COLUMN question_id DROP NOT NULL;

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
