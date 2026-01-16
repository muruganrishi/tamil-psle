/**
 * Validators: /api/saved-words
 */

import { z } from 'zod';

export const SaveWordRequestSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  context: z.string().min(1, 'Context is required'),
  meaning_en: z.string().nullable(),
  meaning_ta: z.string().nullable(),
});

export type SaveWordRequest = z.infer<typeof SaveWordRequestSchema>;

export const SaveWordResponseSchema = z.object({
  id: z.string().uuid(),
  saved_at: z.string().datetime(),
});

export type SaveWordResponse = z.infer<typeof SaveWordResponseSchema>;

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

export const DeleteWordRequestSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteWordRequest = z.infer<typeof DeleteWordRequestSchema>;

export const SavedWordErrorSchema = z.object({
  error: z.string(),
  code: z.enum(['UNAUTHORIZED', 'INVALID_REQUEST', 'WORD_NOT_FOUND', 'DUPLICATE_WORD']),
});

export type SavedWordError = z.infer<typeof SavedWordErrorSchema>;
