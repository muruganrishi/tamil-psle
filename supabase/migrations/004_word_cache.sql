-- Migration 004: Word Cache
-- Creates word_sense_cache and user_saved_words tables

-- Create word_sense_cache table (shared cache for AI-generated meanings)
CREATE TABLE word_sense_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_normalized text NOT NULL,
  context_hash text NOT NULL,
  language_mode language_mode NOT NULL,
  meaning_en text,
  meaning_ta text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Unique constraint for cache key
CREATE UNIQUE INDEX idx_word_sense_cache_key ON word_sense_cache(word_normalized, context_hash, language_mode);

ALTER TABLE word_sense_cache ENABLE ROW LEVEL SECURITY;

-- Create user_saved_words table
CREATE TABLE user_saved_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word text NOT NULL,
  context text NOT NULL,
  meaning_en text,
  meaning_ta text,
  saved_at timestamptz NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX idx_user_saved_words_unique ON user_saved_words(user_id, word, context);
CREATE INDEX idx_user_saved_words_user_id ON user_saved_words(user_id);

ALTER TABLE user_saved_words ENABLE ROW LEVEL SECURITY;
