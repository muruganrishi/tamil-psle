/**
 * Adaimozhi validators
 * Feature: 003-adaimozhi
 *
 * Zod schemas for adaimozhi API request/response validation.
 * Based on contracts/student.ts and contracts/teacher.ts
 */

import { z } from 'zod';

// =============================================================================
// SHARED TYPES
// =============================================================================

export const OptionLabelSchema = z.enum(['A', 'B', 'C', 'D']);
export type OptionLabel = z.infer<typeof OptionLabelSchema>;

export const MCQOptionSchema = z.object({
  label: OptionLabelSchema,
  text: z.string(),
});
export type MCQOption = z.infer<typeof MCQOptionSchema>;

export const AdaimozhiStatusSchema = z.enum(['draft', 'published']);
export type AdaimozhiStatus = z.infer<typeof AdaimozhiStatusSchema>;

// =============================================================================
// DATABASE ENTRY SCHEMA
// =============================================================================

export const AdaimozhiEntrySchema = z.object({
  id: z.string().uuid(),
  phrase_text: z.string(),
  missing_word: z.string(),
  complete_phrase: z.string(),
  meaning_ta: z.string().nullable(),
  meaning_en: z.string().nullable(),
  status: AdaimozhiStatusSchema,
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type AdaimozhiEntry = z.infer<typeof AdaimozhiEntrySchema>;

// =============================================================================
// STUDENT API SCHEMAS
// =============================================================================

/**
 * Query parameters for fetching adaimozhi questions
 */
export const AdaimozhiQuestionsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
  exclude_ids: z.string().optional(),
  assignment_id: z.string().uuid().optional(),
});
export type AdaimozhiQuestionsQuery = z.infer<typeof AdaimozhiQuestionsQuerySchema>;

/**
 * Single adaimozhi question in response
 */
export const AdaimozhiQuestionSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('adaimozhi'),
  questionText: z.string(),
  options: z.array(MCQOptionSchema).length(4),
  correctOption: OptionLabelSchema.optional(),
  metadata: z.object({
    complete_phrase: z.string(),
    meaning_ta: z.string().nullable(),
    meaning_en: z.string().nullable(),
  }),
});
export type AdaimozhiQuestion = z.infer<typeof AdaimozhiQuestionSchema>;

/**
 * Response: List of adaimozhi questions
 */
export const AdaimozhiQuestionsResponseSchema = z.object({
  questions: z.array(AdaimozhiQuestionSchema),
  total: z.number(),
  distractorSource: z.enum(['database', 'ai_fallback', 'mixed']),
});
export type AdaimozhiQuestionsResponse = z.infer<typeof AdaimozhiQuestionsResponseSchema>;

/**
 * Request: Start a new adaimozhi practice session
 */
export const StartAdaimozhiSessionRequestSchema = z.object({
  questionCount: z.number().min(1).max(20).default(10),
  assignmentId: z.string().uuid().optional(),
});
export type StartAdaimozhiSessionRequest = z.infer<typeof StartAdaimozhiSessionRequestSchema>;

/**
 * Response: New session created
 */
export const StartAdaimozhiSessionResponseSchema = z.object({
  attemptId: z.string().uuid(),
  questions: z.array(AdaimozhiQuestionSchema),
  totalQuestions: z.number(),
});
export type StartAdaimozhiSessionResponse = z.infer<typeof StartAdaimozhiSessionResponseSchema>;

/**
 * Response: Next question in session
 */
export const NextQuestionResponseSchema = z.object({
  question: AdaimozhiQuestionSchema.nullable(),
  questionNumber: z.number(),
  totalQuestions: z.number(),
  isComplete: z.boolean(),
});
export type NextQuestionResponse = z.infer<typeof NextQuestionResponseSchema>;

/**
 * Request: Submit answer for current question
 */
export const SubmitAnswerRequestSchema = z.object({
  adaimozhiId: z.string().uuid(),
  selectedOption: OptionLabelSchema,
});
export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerRequestSchema>;

/**
 * Response: Answer result
 */
export const SubmitAnswerResponseSchema = z.object({
  isCorrect: z.boolean(),
  correctOption: OptionLabelSchema,
  metadata: z.object({
    complete_phrase: z.string(),
    meaning_ta: z.string().nullable(),
    meaning_en: z.string().nullable(),
  }),
  nextQuestion: AdaimozhiQuestionSchema.nullable(),
  questionNumber: z.number(),
  totalQuestions: z.number(),
  isComplete: z.boolean(),
});
export type SubmitAnswerResponse = z.infer<typeof SubmitAnswerResponseSchema>;

/**
 * Response: Session completion results
 */
export const SessionResultsResponseSchema = z.object({
  attemptId: z.string().uuid(),
  score: z.number(),
  totalQuestions: z.number(),
  percentage: z.number(),
  results: z.array(
    z.object({
      adaimozhiId: z.string().uuid(),
      questionText: z.string(),
      selectedOption: OptionLabelSchema,
      correctOption: OptionLabelSchema,
      isCorrect: z.boolean(),
      metadata: z.object({
        complete_phrase: z.string(),
        meaning_ta: z.string().nullable(),
        meaning_en: z.string().nullable(),
      }),
    })
  ),
  completedAt: z.string().datetime(),
});
export type SessionResultsResponse = z.infer<typeof SessionResultsResponseSchema>;

// =============================================================================
// TEACHER API SCHEMAS
// =============================================================================

/**
 * Query parameters for listing entries
 */
export const ListEntriesQuerySchema = z.object({
  status: AdaimozhiStatusSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});
export type ListEntriesQuery = z.infer<typeof ListEntriesQuerySchema>;

/**
 * Response: Paginated list of entries
 */
export const ListEntriesResponseSchema = z.object({
  entries: z.array(AdaimozhiEntrySchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});
export type ListEntriesResponse = z.infer<typeof ListEntriesResponseSchema>;

/**
 * Request: Create new adaimozhi entry
 */
export const CreateEntryRequestSchema = z.object({
  phrase_text: z
    .string()
    .min(1, 'Phrase text is required')
    .refine((val) => val.includes('_____'), 'Phrase must contain blank marker (_____)'),
  missing_word: z.string().min(1, 'Missing word is required'),
  complete_phrase: z.string().min(1, 'Complete phrase is required'),
  meaning_ta: z.string().optional(),
  meaning_en: z.string().optional(),
  status: AdaimozhiStatusSchema.default('draft'),
});
export type CreateEntryRequest = z.infer<typeof CreateEntryRequestSchema>;

/**
 * Response: Created entry
 */
export const CreateEntryResponseSchema = z.object({
  entry: AdaimozhiEntrySchema,
});
export type CreateEntryResponse = z.infer<typeof CreateEntryResponseSchema>;

/**
 * Response: Get single entry
 */
export const GetEntryResponseSchema = z.object({
  entry: AdaimozhiEntrySchema,
});
export type GetEntryResponse = z.infer<typeof GetEntryResponseSchema>;

/**
 * Request: Update existing entry
 */
export const UpdateEntryRequestSchema = z.object({
  phrase_text: z
    .string()
    .min(1)
    .refine((val) => val.includes('_____'), 'Phrase must contain blank marker (_____)')
    .optional(),
  missing_word: z.string().min(1).optional(),
  complete_phrase: z.string().min(1).optional(),
  meaning_ta: z.string().nullable().optional(),
  meaning_en: z.string().nullable().optional(),
  status: AdaimozhiStatusSchema.optional(),
});
export type UpdateEntryRequest = z.infer<typeof UpdateEntryRequestSchema>;

/**
 * Response: Updated entry
 */
export const UpdateEntryResponseSchema = z.object({
  entry: AdaimozhiEntrySchema,
});
export type UpdateEntryResponse = z.infer<typeof UpdateEntryResponseSchema>;

/**
 * Response: Delete entry
 */
export const DeleteEntryResponseSchema = z.object({
  success: z.boolean(),
  deletedId: z.string().uuid(),
});
export type DeleteEntryResponse = z.infer<typeof DeleteEntryResponseSchema>;

// =============================================================================
// CSV IMPORT SCHEMAS
// =============================================================================

/**
 * CSV row schema for validation
 */
export const CSVRowSchema = z.object({
  phrase_with_blank: z
    .string()
    .min(1)
    .refine((val) => val.includes('_____'), 'Phrase must contain blank marker (_____)'),
  missing_word: z.string().min(1),
  complete_phrase: z.string().min(1),
  meaning_ta: z.string().optional(),
  meaning_en: z.string().optional(),
});
export type CSVRow = z.infer<typeof CSVRowSchema>;

/**
 * Import preview row with validation status
 */
export const ImportPreviewRowSchema = z.object({
  row: z.number(),
  phrase_text: z.string(),
  missing_word: z.string(),
  complete_phrase: z.string(),
  meaning_ta: z.string().nullable(),
  meaning_en: z.string().nullable(),
  valid: z.boolean(),
  error: z.string().nullable(),
  isDuplicate: z.boolean(),
});
export type ImportPreviewRow = z.infer<typeof ImportPreviewRowSchema>;

/**
 * Response: Import preview (before confirmation)
 */
export const ImportPreviewResponseSchema = z.object({
  preview: z.array(ImportPreviewRowSchema),
  validCount: z.number(),
  errorCount: z.number(),
  duplicateCount: z.number(),
});
export type ImportPreviewResponse = z.infer<typeof ImportPreviewResponseSchema>;

/**
 * Request: Confirm import (after preview)
 */
export const ConfirmImportRequestSchema = z.object({
  rows: z.array(z.number()),
});
export type ConfirmImportRequest = z.infer<typeof ConfirmImportRequestSchema>;

/**
 * Response: Import result
 */
export const ImportResultResponseSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
  errors: z.array(
    z.object({
      row: z.number(),
      error: z.string(),
    })
  ),
  entries: z.array(AdaimozhiEntrySchema),
});
export type ImportResultResponse = z.infer<typeof ImportResultResponseSchema>;

// =============================================================================
// AI GENERATION SCHEMAS
// =============================================================================

/**
 * Request: Generate new adaimozhi phrases via AI
 */
export const AIGenerateRequestSchema = z
  .object({
    type: z.enum(['phrases', 'distractors']),
    count: z.number().min(1).max(5).default(3),
    context: z.string().optional(),
    phrase_text: z.string().optional(),
  })
  .refine((data) => data.type !== 'distractors' || data.phrase_text, {
    message: 'phrase_text required when generating distractors',
    path: ['phrase_text'],
  });
export type AIGenerateRequest = z.infer<typeof AIGenerateRequestSchema>;

/**
 * AI-generated suggestion
 */
export const AISuggestionSchema = z.object({
  phrase_text: z.string(),
  missing_word: z.string(),
  complete_phrase: z.string(),
  meaning_ta: z.string(),
  meaning_en: z.string().nullable(),
});
export type AISuggestion = z.infer<typeof AISuggestionSchema>;

/**
 * Response: AI generation result
 */
export const AIGenerateResponseSchema = z.object({
  suggestions: z.array(AISuggestionSchema),
  cached: z.boolean(),
});
export type AIGenerateResponse = z.infer<typeof AIGenerateResponseSchema>;

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Request: Bulk publish entries
 */
export const BulkPublishRequestSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});
export type BulkPublishRequest = z.infer<typeof BulkPublishRequestSchema>;

/**
 * Response: Bulk operation result
 */
export const BulkOperationResponseSchema = z.object({
  success: z.number(),
  failed: z.number(),
  errors: z.array(
    z.object({
      id: z.string().uuid(),
      error: z.string(),
    })
  ),
});
export type BulkOperationResponse = z.infer<typeof BulkOperationResponseSchema>;

// =============================================================================
// ERROR RESPONSES
// =============================================================================

export const StudentErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_REQUEST',
  'RATE_LIMITED',
  'INSUFFICIENT_CONTENT',
  'SESSION_EXPIRED',
  'INTERNAL_ERROR',
]);
export type StudentErrorCode = z.infer<typeof StudentErrorCodeSchema>;

export const TeacherErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_REQUEST',
  'DUPLICATE_ENTRY',
  'RATE_LIMITED',
  'CSV_PARSE_ERROR',
  'AI_GENERATION_ERROR',
  'INTERNAL_ERROR',
]);
export type TeacherErrorCode = z.infer<typeof TeacherErrorCodeSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
