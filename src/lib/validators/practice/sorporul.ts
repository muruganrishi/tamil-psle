/**
 * Sorporul (Word Meanings) validators
 * Feature-specific validators for the sorporul practice section
 */

import { z } from 'zod';
import { UUIDSchema, OptionLabelSchema } from './common';

// ============================================================================
// SORPORUL METADATA
// ============================================================================

/**
 * Sorporul question metadata schema
 * Extends base metadata with word-meaning specific fields
 */
export const SorporulMetadataSchema = z.object({
  /** The target Tamil word being tested */
  targetWord: z.string().min(1, 'Target word is required'),
  /** Word class (noun, verb, adjective, etc.) */
  wordClass: z
    .enum(['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'other'])
    .optional(),
  /** Example sentence using the word */
  exampleSentence: z.string().optional(),
  /** Difficulty level (1-5) */
  difficulty: z.number().int().min(1).max(5).optional(),
  /** Topic/subtopic tags */
  tags: z.array(z.string()).optional(),
  /** Source reference */
  source: z.string().optional(),
});

export type SorporulMetadata = z.infer<typeof SorporulMetadataSchema>;

// ============================================================================
// AI DISTRACTOR GENERATION
// ============================================================================

/**
 * Request schema for AI distractor generation
 */
export const GenerateDistractorsRequestSchema = z.object({
  /** The target Tamil word */
  targetWord: z.string().min(1, 'Target word is required'),
  /** The correct meaning/definition */
  correctMeaning: z.string().min(1, 'Correct meaning is required'),
  /** Number of distractors to generate (default 3) */
  count: z.coerce.number().int().min(1).max(5).default(3),
  /** Word class hint for better distractors */
  wordClass: z
    .enum(['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'other'])
    .optional(),
  /** Language for meanings */
  meaningLanguage: z.enum(['ta', 'en']).default('ta'),
});

export type GenerateDistractorsRequest = z.infer<typeof GenerateDistractorsRequestSchema>;

/**
 * Single distractor item
 */
export const DistractorItemSchema = z.object({
  /** The distractor text (wrong meaning) */
  text: z.string(),
  /** Why this distractor is plausible (for teacher reference) */
  rationale: z.string().optional(),
});

export type DistractorItem = z.infer<typeof DistractorItemSchema>;

/**
 * Response schema for AI distractor generation
 */
export const GenerateDistractorsResponseSchema = z.object({
  /** Generated distractor options */
  distractors: z.array(DistractorItemSchema),
  /** Whether response was from cache */
  cached: z.boolean(),
});

export type GenerateDistractorsResponse = z.infer<typeof GenerateDistractorsResponseSchema>;

// ============================================================================
// CSV IMPORT
// ============================================================================

/**
 * CSV import row schema for sorporul questions
 */
export const SorporulCSVRowSchema = z.object({
  /** Target word (required) */
  targetWord: z.string().min(1, 'Target word is required'),
  /** Question text (e.g., "இச்சொல்லின் பொருள் என்ன?") */
  questionText: z.string().min(1, 'Question text is required'),
  /** Option A text (definition) */
  optionA: z.string().min(1, 'Option A is required'),
  /** Option B text (definition) */
  optionB: z.string().min(1, 'Option B is required'),
  /** Option C text (definition) */
  optionC: z.string().min(1, 'Option C is required'),
  /** Option D text (definition) */
  optionD: z.string().min(1, 'Option D is required'),
  /** Correct answer (A, B, C, or D) */
  correctAnswer: OptionLabelSchema,
  /** Word class (optional) */
  wordClass: z
    .enum(['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'other'])
    .optional(),
  /** Example sentence (optional) */
  exampleSentence: z.string().optional(),
  /** Difficulty (1-5, optional) */
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  /** Tags (comma-separated, optional) */
  tags: z.string().optional(),
});

export type SorporulCSVRow = z.infer<typeof SorporulCSVRowSchema>;

/**
 * Bulk import request schema for sorporul
 */
export const SorporulBulkImportRequestSchema = z.object({
  /** Questions to import */
  questions: z.array(SorporulCSVRowSchema).min(1).max(500),
  /** Whether to publish immediately */
  publishImmediately: z.boolean().default(false),
});

export type SorporulBulkImportRequest = z.infer<typeof SorporulBulkImportRequestSchema>;

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

/**
 * Create sorporul question request schema
 */
export const CreateSorporulQuestionRequestSchema = z.object({
  /** Target word */
  targetWord: z.string().min(1, 'Target word is required').max(100),
  /** Question text */
  questionText: z.string().min(1, 'Question text is required').max(2000),
  /** Four options with labels and correct marker */
  options: z
    .array(
      z.object({
        label: OptionLabelSchema,
        text: z.string().min(1, 'Option text is required').max(1000),
        isCorrect: z.boolean(),
      })
    )
    .length(4, 'Exactly 4 options are required')
    .refine(
      (options) => options.filter((o) => o.isCorrect).length === 1,
      'Exactly one option must be marked as correct'
    ),
  /** Additional metadata */
  metadata: SorporulMetadataSchema.partial().optional(),
  /** Content status */
  status: z.enum(['draft', 'published']).default('draft'),
});

export type CreateSorporulQuestionRequest = z.infer<typeof CreateSorporulQuestionRequestSchema>;

/**
 * Update sorporul question request schema
 */
export const UpdateSorporulQuestionRequestSchema = z.object({
  /** Question ID */
  id: UUIDSchema,
  /** Target word */
  targetWord: z.string().min(1).max(100).optional(),
  /** Question text */
  questionText: z.string().min(1).max(2000).optional(),
  /** Options (if provided, must be complete set of 4) */
  options: z
    .array(
      z.object({
        label: OptionLabelSchema,
        text: z.string().min(1).max(1000),
        isCorrect: z.boolean(),
      })
    )
    .length(4)
    .refine(
      (options) => options.filter((o) => o.isCorrect).length === 1,
      'Exactly one option must be marked as correct'
    )
    .optional(),
  /** Additional metadata */
  metadata: SorporulMetadataSchema.partial().optional(),
  /** Content status */
  status: z.enum(['draft', 'published']).optional(),
});

export type UpdateSorporulQuestionRequest = z.infer<typeof UpdateSorporulQuestionRequestSchema>;

/**
 * List sorporul questions request schema
 */
export const ListSorporulQuestionsRequestSchema = z.object({
  /** Filter by status */
  status: z.enum(['draft', 'published', 'all']).default('all'),
  /** Search in question text or target word */
  search: z.string().max(200).optional(),
  /** Pagination cursor */
  cursor: UUIDSchema.optional(),
  /** Results per page */
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListSorporulQuestionsRequest = z.infer<typeof ListSorporulQuestionsRequestSchema>;

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Sorporul-specific error codes
 */
export const SorporulErrorCodeSchema = z.enum([
  // Inherited from common
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INVALID_REQUEST',
  'NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  // Sorporul-specific
  'QUESTION_NOT_FOUND',
  'DUPLICATE_WORD',
  'AI_GENERATION_FAILED',
  'IMPORT_FAILED',
  'INVALID_CSV_FORMAT',
]);

export type SorporulErrorCode = z.infer<typeof SorporulErrorCodeSchema>;
