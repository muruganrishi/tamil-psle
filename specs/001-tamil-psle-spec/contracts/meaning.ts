/**
 * API Contract: /api/meaning
 * Purpose: Get contextual meaning for a Tamil word
 * Auth: Required (any role)
 * Rate Limit: 60/min per user
 */

import { z } from 'zod';

// =============================================================================
// Request Schema
// =============================================================================

export const MeaningRequestSchema = z.object({
  /** The Tamil word to look up */
  word: z.string().min(1, 'Word is required'),

  /** Surrounding context (2-3 words before/after or full sentence) */
  context: z.string().min(1, 'Context is required'),

  /** Language mode for meaning display */
  language_mode: z.enum(['en', 'ta', 'both']).default('both'),
});

export type MeaningRequest = z.infer<typeof MeaningRequestSchema>;

// =============================================================================
// Response Schema
// =============================================================================

export const MeaningResponseSchema = z.object({
  /** The word that was looked up */
  word: z.string(),

  /** English meaning (null if language_mode is 'ta') */
  meaning_en: z.string().nullable(),

  /** Tamil meaning (null if language_mode is 'en') */
  meaning_ta: z.string().nullable(),

  /** Whether the response came from cache */
  cached: z.boolean(),
});

export type MeaningResponse = z.infer<typeof MeaningResponseSchema>;

// =============================================================================
// Error Response Schema
// =============================================================================

export const MeaningErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    'RATE_LIMITED',
    'INVALID_REQUEST',
    'AI_UNAVAILABLE',
    'UNAUTHORIZED',
  ]),
});

export type MeaningError = z.infer<typeof MeaningErrorSchema>;

// =============================================================================
// Examples
// =============================================================================

export const examples = {
  request: {
    word: 'பள்ளி',
    context: 'நான் பள்ளி செல்கிறேன்',
    language_mode: 'both',
  } satisfies MeaningRequest,

  response: {
    word: 'பள்ளி',
    meaning_en: 'school',
    meaning_ta: 'கல்வி நிலையம்',
    cached: true,
  } satisfies MeaningResponse,

  errorRateLimit: {
    error: 'Please wait a moment before looking up more words',
    code: 'RATE_LIMITED',
  } satisfies MeaningError,
};
