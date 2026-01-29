/**
 * Adaimozhi distractor selection utility
 * Feature: 003-adaimozhi
 *
 * Selects distractors (wrong answers) from the database for MCQ options.
 * Falls back to AI generation when insufficient DB entries exist.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { generateFallbackDistractors } from '@/lib/ai/adaimozhi-fallback';

// Note: Using any for client type until Database types are regenerated after migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any>;

export interface DistractorResult {
  distractors: string[];
  source: 'database' | 'ai_fallback' | 'mixed';
  aiUsed: boolean;
}

/**
 * Minimum number of distractors needed for a complete MCQ (4 options total, 1 correct + 3 wrong)
 */
const REQUIRED_DISTRACTORS = 3;

/**
 * Select distractors for an adaimozhi question.
 *
 * Strategy:
 * 1. Query DB for missing_words from OTHER published entries
 * 2. If insufficient (<3), use AI fallback to generate remaining
 * 3. Return combined list with source tracking
 *
 * @param supabase - Supabase client instance
 * @param entryId - The current adaimozhi entry ID (to exclude from distractors)
 * @param correctWord - The correct answer (to exclude from distractors)
 * @param phraseText - The phrase text (needed for AI fallback context)
 */
export async function selectDistractors(
  supabase: AnySupabaseClient,
  entryId: string,
  correctWord: string,
  phraseText: string
): Promise<DistractorResult> {
  // Step 1: Query DB for distractors
  const { data: dbDistractors, error } = await supabase
    .from('adaimozhi')
    .select('missing_word')
    .neq('id', entryId)
    .neq('missing_word', correctWord)
    .eq('status', 'published')
    .limit(REQUIRED_DISTRACTORS);

  if (error) {
    console.error('[adaimozhi-distractors] DB query error:', error);
    // Fall back to pure AI generation
    const aiDistractors = await generateFallbackDistractors(phraseText, correctWord, REQUIRED_DISTRACTORS);
    return {
      distractors: aiDistractors,
      source: 'ai_fallback',
      aiUsed: true,
    };
  }

  const dbWords = dbDistractors?.map((d) => d.missing_word) || [];
  const uniqueDbWords = [...new Set(dbWords)];

  // Step 2: Check if we have enough distractors
  if (uniqueDbWords.length >= REQUIRED_DISTRACTORS) {
    return {
      distractors: uniqueDbWords.slice(0, REQUIRED_DISTRACTORS),
      source: 'database',
      aiUsed: false,
    };
  }

  // Step 3: Use AI fallback for remaining distractors
  const needed = REQUIRED_DISTRACTORS - uniqueDbWords.length;
  const aiDistractors = await generateFallbackDistractors(
    phraseText,
    correctWord,
    needed,
    uniqueDbWords // Exclude already-selected words
  );

  const combined = [...uniqueDbWords, ...aiDistractors].slice(0, REQUIRED_DISTRACTORS);

  return {
    distractors: combined,
    source: uniqueDbWords.length > 0 ? 'mixed' : 'ai_fallback',
    aiUsed: true,
  };
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Build MCQ options from correct answer and distractors
 */
export function buildMCQOptions(
  correctWord: string,
  distractors: string[]
): { label: 'A' | 'B' | 'C' | 'D'; text: string; isCorrect: boolean }[] {
  const allOptions = [
    { text: correctWord, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ];

  const shuffled = shuffleArray(allOptions);
  const labels = ['A', 'B', 'C', 'D'] as const;

  return shuffled.map((opt, i) => ({
    label: labels[i],
    text: opt.text,
    isCorrect: opt.isCorrect,
  }));
}

/**
 * Find the correct option label from built options
 */
export function findCorrectLabel(
  options: { label: 'A' | 'B' | 'C' | 'D'; isCorrect: boolean }[]
): 'A' | 'B' | 'C' | 'D' {
  const correct = options.find((o) => o.isCorrect);
  return correct?.label ?? 'A';
}
