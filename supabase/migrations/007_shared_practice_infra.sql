-- Migration 007: Shared Practice Infrastructure
-- Creates shared tables, columns, indexes, and RLS policies for practice features
--
-- READ-ONLY: Feature agents must not modify this migration
-- Any changes to shared infrastructure must be coordinated

-- ============================================================================
-- SCHEMA CHANGES
-- ============================================================================

-- Add metadata column to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- Create index on metadata for efficient querying
CREATE INDEX IF NOT EXISTS idx_questions_metadata ON questions USING gin(metadata);

-- ============================================================================
-- AI GENERATION CACHE TABLE
-- ============================================================================

-- Create table for caching AI-generated content
CREATE TABLE IF NOT EXISTS ai_generation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task text NOT NULL,
  input_hash text NOT NULL,
  output_json jsonb NOT NULL,
  model text NOT NULL DEFAULT 'gemini-1.5-flash',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  -- Unique constraint on task + input_hash for efficient lookup
  CONSTRAINT ai_generation_cache_task_input_unique UNIQUE (task, input_hash)
);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_task_hash ON ai_generation_cache(task, input_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created_at ON ai_generation_cache(created_at);

-- Enable RLS
ALTER TABLE ai_generation_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER VOCAB REVIEWS TABLE (Spaced Repetition)
-- ============================================================================

-- Create table for tracking vocabulary review state
CREATE TABLE IF NOT EXISTS user_vocab_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word text NOT NULL,
  next_review_at timestamptz NOT NULL DEFAULT NOW(),
  interval_days integer NOT NULL DEFAULT 0,
  ease numeric(4,2) NOT NULL DEFAULT 2.50,
  last_result text CHECK (last_result IN ('easy', 'good', 'hard', 'again')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  -- Each user can have only one review record per word
  CONSTRAINT user_vocab_reviews_user_word_unique UNIQUE (user_id, word)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_user_id ON user_vocab_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_next_review ON user_vocab_reviews(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_word ON user_vocab_reviews(word);

-- Enable RLS
ALTER TABLE user_vocab_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on questions for section + status (used in practice queries)
-- This may already exist but we use IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_questions_section_status ON questions(section, status);

-- Index on question_options for question lookup (may already exist)
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);

-- Index on attempts for user practice history
CREATE INDEX IF NOT EXISTS idx_attempts_user_section ON attempts(user_id, section);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);

-- Index on attempt_answers for result lookup
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);

-- Index on user_saved_words for vocab bank queries
CREATE INDEX IF NOT EXISTS idx_user_saved_words_user_id ON user_saved_words(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_words_word ON user_saved_words(word);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- --------------------------------------------------------------------------
-- AI Generation Cache Policies
-- --------------------------------------------------------------------------

-- Authenticated users can read from cache (for client-side caching checks)
DROP POLICY IF EXISTS "Authenticated users read cache" ON ai_generation_cache;
CREATE POLICY "Authenticated users read cache" ON ai_generation_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only service role can insert/update cache (server-side only)
-- Note: Regular authenticated users cannot insert - this is by design
-- The server will use the service role key for cache operations
DROP POLICY IF EXISTS "Service role manages cache" ON ai_generation_cache;
CREATE POLICY "Service role manages cache" ON ai_generation_cache
  FOR ALL USING (
    -- This policy only applies when using service role key
    -- Regular auth.uid() calls will not match this
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Alternative: Allow authenticated users to insert (simpler approach)
-- Uncomment this if you want to allow direct client inserts
-- DROP POLICY IF EXISTS "Authenticated users insert cache" ON ai_generation_cache;
-- CREATE POLICY "Authenticated users insert cache" ON ai_generation_cache
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- --------------------------------------------------------------------------
-- User Vocab Reviews Policies
-- --------------------------------------------------------------------------

-- Users can read their own review data
DROP POLICY IF EXISTS "Users read own vocab reviews" ON user_vocab_reviews;
CREATE POLICY "Users read own vocab reviews" ON user_vocab_reviews
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own review data
DROP POLICY IF EXISTS "Users insert own vocab reviews" ON user_vocab_reviews;
CREATE POLICY "Users insert own vocab reviews" ON user_vocab_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own review data
DROP POLICY IF EXISTS "Users update own vocab reviews" ON user_vocab_reviews;
CREATE POLICY "Users update own vocab reviews" ON user_vocab_reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own review data
DROP POLICY IF EXISTS "Users delete own vocab reviews" ON user_vocab_reviews;
CREATE POLICY "Users delete own vocab reviews" ON user_vocab_reviews
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_generation_cache IS 'Cache for AI-generated content to reduce API calls and improve performance';
COMMENT ON COLUMN ai_generation_cache.task IS 'Type of AI task (e.g., word_meaning, explanation, hint)';
COMMENT ON COLUMN ai_generation_cache.input_hash IS 'Hash of input parameters for deduplication';
COMMENT ON COLUMN ai_generation_cache.output_json IS 'Cached AI response as JSON';
COMMENT ON COLUMN ai_generation_cache.model IS 'AI model used for generation';

COMMENT ON TABLE user_vocab_reviews IS 'Spaced repetition review state for vocabulary learning';
COMMENT ON COLUMN user_vocab_reviews.interval_days IS 'Days until next review (SM-2 algorithm)';
COMMENT ON COLUMN user_vocab_reviews.ease IS 'Ease factor for SM-2 algorithm (1.3 to 2.5)';
COMMENT ON COLUMN user_vocab_reviews.last_result IS 'Result of the last review (easy/good/hard/again)';

COMMENT ON COLUMN questions.metadata IS 'Flexible JSON metadata for section-specific question data';
