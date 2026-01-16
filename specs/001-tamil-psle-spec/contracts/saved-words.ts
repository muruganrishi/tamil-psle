/**
 * API Contract: /api/saved-words
 * Purpose: Save/manage personal vocabulary list
 * Auth: Required (student)
 * Methods: POST, GET, DELETE
 */

import { z } from 'zod';

// =============================================================================
// POST Request Schema - Save a word
// =============================================================================

export const SaveWordRequestSchema = z.object({
  /** The Tamil word to save */
  word: z.string().min(1, 'Word is required'),

  /** The context where the word appeared */
  context: z.string().min(1, 'Context is required'),

  /** English meaning (optional if language was 'ta' only) */
  meaning_en: z.string().nullable(),

  /** Tamil meaning (optional if language was 'en' only) */
  meaning_ta: z.string().nullable(),
});

export type SaveWordRequest = z.infer<typeof SaveWordRequestSchema>;

// =============================================================================
// POST Response Schema
// =============================================================================

export const SaveWordResponseSchema = z.object({
  id: z.string().uuid(),
  saved_at: z.string().datetime(),
});

export type SaveWordResponse = z.infer<typeof SaveWordResponseSchema>;

// =============================================================================
// GET Response Schema - List saved words
// =============================================================================

export const SavedWordSchema = z.object({
  id: z.string().uuid(),
  word: z.string(),
  context: z.string(),
  meaning_en: z.string().nullable(),
  meaning_ta: z.string().nullable(),
  saved_at: z.string().datetime(),
});

export type SavedWord = z.infer<typeof SavedWordSchema>;

export const SavedWordsListResponseSchema = z.object({
  words: z.array(SavedWordSchema),
  total: z.number().int().min(0),
});

export type SavedWordsListResponse = z.infer<typeof SavedWordsListResponseSchema>;

// =============================================================================
// DELETE Request Schema
// =============================================================================

export const DeleteWordRequestSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteWordRequest = z.infer<typeof DeleteWordRequestSchema>;

// =============================================================================
// Error Response Schema
// =============================================================================

export const SavedWordErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    'UNAUTHORIZED',
    'INVALID_REQUEST',
    'WORD_NOT_FOUND',
    'DUPLICATE_WORD',
  ]),
});

export type SavedWordError = z.infer<typeof SavedWordErrorSchema>;

// =============================================================================
// Examples
// =============================================================================

export const examples = {
  saveRequest: {
    word: 'பள்ளி',
    context: 'நான் பள்ளி செல்கிறேன்',
    meaning_en: 'school',
    meaning_ta: 'கல்வி நிலையம்',
  } satisfies SaveWordRequest,

  saveResponse: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    saved_at: '2026-01-16T10:30:00Z',
  } satisfies SaveWordResponse,

  listResponse: {
    words: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        word: 'பள்ளி',
        context: 'நான் பள்ளி செல்கிறேன்',
        meaning_en: 'school',
        meaning_ta: 'கல்வி நிலையம்',
        saved_at: '2026-01-16T10:30:00Z',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        word: 'வீடு',
        context: 'என் வீடு பெரியது',
        meaning_en: 'house, home',
        meaning_ta: 'இல்லம்',
        saved_at: '2026-01-16T11:00:00Z',
      },
    ],
    total: 2,
  } satisfies SavedWordsListResponse,

  errorDuplicate: {
    error: 'This word is already saved in the same context',
    code: 'DUPLICATE_WORD',
  } satisfies SavedWordError,
};
