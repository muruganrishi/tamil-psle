/**
 * Student API Contracts - Adaimozhi Practice
 *
 * Feature: 003-adaimozhi
 * Date: 2026-01-27
 *
 * These contracts define the API request/response shapes for student practice flows.
 * Implementation should validate using these Zod schemas.
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

// =============================================================================
// GET /api/practice/adaimozhi - Fetch Questions
// =============================================================================

/**
 * Query parameters for fetching adaimozhi questions
 */
export const AdaimozhiQuestionsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
  exclude_ids: z.string().optional(), // Comma-separated UUIDs
  assignment_id: z.string().uuid().optional(),
});
export type AdaimozhiQuestionsQuery = z.infer<typeof AdaimozhiQuestionsQuerySchema>;

/**
 * Single adaimozhi question in response
 */
export const AdaimozhiQuestionSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('adaimozhi'), // Distinguishes from regular questions
  questionText: z.string(), // phrase_text with blank
  options: z.array(MCQOptionSchema).length(4),
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

// =============================================================================
// POST /api/practice/adaimozhi/sessions - Start Practice Session
// =============================================================================

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

// =============================================================================
// GET /api/practice/adaimozhi/sessions/[attemptId]/next - Get Next Question
// =============================================================================

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

// =============================================================================
// POST /api/practice/adaimozhi/sessions/[attemptId]/submit - Submit Answer
// =============================================================================

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

// =============================================================================
// POST /api/practice/adaimozhi/sessions/[attemptId]/complete - Complete Session
// =============================================================================

/**
 * Response: Session completion results
 */
export const SessionResultsResponseSchema = z.object({
  attemptId: z.string().uuid(),
  score: z.number(),
  totalQuestions: z.number(),
  percentage: z.number(),
  results: z.array(z.object({
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
  })),
  completedAt: z.string().datetime(),
});
export type SessionResultsResponse = z.infer<typeof SessionResultsResponseSchema>;

// =============================================================================
// ERROR RESPONSES
// =============================================================================

export const ErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_REQUEST',
  'RATE_LIMITED',
  'INSUFFICIENT_CONTENT', // Not enough adaimozhi entries for practice
  'SESSION_EXPIRED',
  'INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
