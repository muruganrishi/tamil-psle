/**
 * Validators: /api/meaning
 */

import { z } from 'zod';

export const MeaningRequestSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  context: z.string().min(1, 'Context is required'),
  language_mode: z.enum(['en', 'ta', 'both']).default('both'),
});

export type MeaningRequest = z.infer<typeof MeaningRequestSchema>;

export const MeaningResponseSchema = z.object({
  word: z.string(),
  meaning_en: z.string().nullable(),
  meaning_ta: z.string().nullable(),
  cached: z.boolean(),
});

export type MeaningResponse = z.infer<typeof MeaningResponseSchema>;

export const MeaningErrorSchema = z.object({
  error: z.string(),
  code: z.enum(['RATE_LIMITED', 'INVALID_REQUEST', 'AI_UNAVAILABLE', 'UNAUTHORIZED']),
});

export type MeaningError = z.infer<typeof MeaningErrorSchema>;
