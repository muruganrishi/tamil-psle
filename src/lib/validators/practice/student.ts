/**
 * Student practice validators
 * READ-ONLY: Feature agents must not modify this file
 */

import { z } from 'zod';
import {
  PracticeSectionSchema,
  OptionLabelSchema,
  UUIDSchema,
  PracticeQuestionSchema,
  PaginationSchema,
  createPaginatedResponseSchema,
  LanguageModeSchema,
} from './common';

// ============================================================================
// ATTEMPT MANAGEMENT
// ============================================================================

/**
 * Create attempt request schema
 */
export const CreateAttemptRequestSchema = z.object({
  section: PracticeSectionSchema,
  assignmentId: UUIDSchema.nullable().optional(),
  questionCount: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateAttemptRequest = z.infer<typeof CreateAttemptRequestSchema>;

/**
 * Attempt session response schema
 */
export const AttemptSessionSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  section: PracticeSectionSchema,
  assignmentId: UUIDSchema.nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  score: z.number().int().min(0).nullable(),
  totalQuestions: z.number().int().min(1),
});

export type AttemptSession = z.infer<typeof AttemptSessionSchema>;

// ============================================================================
// QUESTIONS
// ============================================================================

/**
 * Fetch next question request schema
 */
export const NextQuestionRequestSchema = z.object({
  attemptId: UUIDSchema,
  currentQuestionNumber: z.coerce.number().int().min(0).default(0),
});

export type NextQuestionRequest = z.infer<typeof NextQuestionRequestSchema>;

/**
 * Next question response schema
 */
export const NextQuestionResponseSchema = z.object({
  question: PracticeQuestionSchema,
  questionNumber: z.number().int().min(1),
  totalQuestions: z.number().int().min(1),
  isLast: z.boolean(),
});

export type NextQuestionResponse = z.infer<typeof NextQuestionResponseSchema>;

// ============================================================================
// ANSWERS
// ============================================================================

/**
 * Single answer submission schema
 */
export const AnswerSubmissionSchema = z.object({
  questionId: UUIDSchema,
  selectedOption: OptionLabelSchema,
});

export type AnswerSubmission = z.infer<typeof AnswerSubmissionSchema>;

/**
 * Submit answers request schema
 */
export const SubmitAnswersRequestSchema = z.object({
  attemptId: UUIDSchema,
  answers: z.array(AnswerSubmissionSchema).min(1, 'At least one answer is required'),
});

export type SubmitAnswersRequest = z.infer<typeof SubmitAnswersRequestSchema>;

/**
 * Question result schema
 */
export const QuestionResultSchema = z.object({
  questionId: UUIDSchema,
  isCorrect: z.boolean(),
  correctOption: OptionLabelSchema,
  selectedOption: OptionLabelSchema,
});

export type QuestionResult = z.infer<typeof QuestionResultSchema>;

/**
 * Attempt result response schema
 */
export const AttemptResultResponseSchema = z.object({
  attemptId: UUIDSchema,
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  results: z.array(QuestionResultSchema),
  completedAt: z.string().datetime(),
});

export type AttemptResultResponse = z.infer<typeof AttemptResultResponseSchema>;

// ============================================================================
// VOCABULARY
// ============================================================================

/**
 * Save word request schema
 */
export const SaveWordRequestSchema = z.object({
  word: z.string().min(1, 'Word is required').max(100),
  context: z.string().min(1, 'Context is required').max(1000),
  meaningEn: z.string().max(500).nullable().optional(),
  meaningTa: z.string().max(500).nullable().optional(),
});

export type SaveWordRequest = z.infer<typeof SaveWordRequestSchema>;

/**
 * Saved word response schema
 */
export const SavedWordSchema = z.object({
  id: UUIDSchema,
  word: z.string(),
  context: z.string(),
  meaningEn: z.string().nullable(),
  meaningTa: z.string().nullable(),
  savedAt: z.string().datetime(),
});

export type SavedWord = z.infer<typeof SavedWordSchema>;

/**
 * List saved words request schema
 */
export const ListSavedWordsRequestSchema = PaginationSchema.extend({
  search: z.string().max(100).optional(),
});

export type ListSavedWordsRequest = z.infer<typeof ListSavedWordsRequestSchema>;

/**
 * List saved words response schema
 */
export const ListSavedWordsResponseSchema = createPaginatedResponseSchema(SavedWordSchema);

export type ListSavedWordsResponse = z.infer<typeof ListSavedWordsResponseSchema>;

/**
 * Vocab lookup request schema
 */
export const VocabLookupRequestSchema = z.object({
  word: z.string().min(1, 'Word is required').max(100),
  context: z.string().min(1, 'Context is required').max(1000),
  languageMode: LanguageModeSchema.default('both'),
});

export type VocabLookupRequest = z.infer<typeof VocabLookupRequestSchema>;

/**
 * Vocab lookup response schema
 */
export const VocabLookupResponseSchema = z.object({
  word: z.string(),
  meaningEn: z.string().nullable(),
  meaningTa: z.string().nullable(),
  cached: z.boolean(),
});

export type VocabLookupResponse = z.infer<typeof VocabLookupResponseSchema>;

// ============================================================================
// SPACED REPETITION REVIEW
// ============================================================================

/**
 * Review result enum
 */
export const ReviewResultSchema = z.enum(['easy', 'good', 'hard', 'again']);

export type ReviewResult = z.infer<typeof ReviewResultSchema>;

/**
 * Vocab review item schema
 */
export const VocabReviewItemSchema = z.object({
  word: z.string(),
  nextReviewAt: z.string().datetime(),
  intervalDays: z.number().int().min(0),
  ease: z.number().min(1).max(5),
  lastResult: ReviewResultSchema.nullable(),
});

export type VocabReviewItem = z.infer<typeof VocabReviewItemSchema>;

/**
 * Get due reviews request schema
 */
export const GetDueReviewsRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type GetDueReviewsRequest = z.infer<typeof GetDueReviewsRequestSchema>;

/**
 * Submit review request schema
 */
export const SubmitReviewRequestSchema = z.object({
  word: z.string().min(1),
  result: ReviewResultSchema,
});

export type SubmitReviewRequest = z.infer<typeof SubmitReviewRequestSchema>;

/**
 * Submit review response schema
 */
export const SubmitReviewResponseSchema = z.object({
  word: z.string(),
  nextReviewAt: z.string().datetime(),
  intervalDays: z.number().int().min(0),
  ease: z.number(),
});

export type SubmitReviewResponse = z.infer<typeof SubmitReviewResponseSchema>;

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Student API error codes
 */
export const StudentErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'INVALID_REQUEST',
  'NOT_FOUND',
  'ATTEMPT_NOT_FOUND',
  'ATTEMPT_ALREADY_COMPLETED',
  'QUESTION_NOT_FOUND',
  'ASSIGNMENT_NOT_FOUND',
  'MAX_ATTEMPTS_EXCEEDED',
  'ASSIGNMENT_CLOSED',
  'WORD_ALREADY_SAVED',
  'AI_UNAVAILABLE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);

export type StudentErrorCode = z.infer<typeof StudentErrorCodeSchema>;
