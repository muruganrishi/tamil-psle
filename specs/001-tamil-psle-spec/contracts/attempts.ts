/**
 * API Contract: /api/attempts
 * Purpose: Submit a completed practice attempt
 * Auth: Required (student)
 * Method: POST
 */

import { z } from 'zod';
import { QuestionSectionSchema } from './questions';

// =============================================================================
// Request Schema
// =============================================================================

export const AnswerSubmissionSchema = z.object({
  question_id: z.string().uuid(),
  selected_option: z.enum(['A', 'B', 'C', 'D']),
});

export type AnswerSubmission = z.infer<typeof AnswerSubmissionSchema>;

export const AttemptRequestSchema = z.object({
  /** Section being practiced */
  section: QuestionSectionSchema,

  /** Assignment ID if this is an assignment attempt (null for free practice) */
  assignment_id: z.string().uuid().nullable(),

  /** Array of answers for each question */
  answers: z
    .array(AnswerSubmissionSchema)
    .min(1, 'At least one answer is required'),
});

export type AttemptRequest = z.infer<typeof AttemptRequestSchema>;

// =============================================================================
// Response Schema
// =============================================================================

export const QuestionResultSchema = z.object({
  question_id: z.string().uuid(),
  correct: z.boolean(),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
});

export type QuestionResult = z.infer<typeof QuestionResultSchema>;

export const AttemptResponseSchema = z.object({
  attempt_id: z.string().uuid(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  results: z.array(QuestionResultSchema),
});

export type AttemptResponse = z.infer<typeof AttemptResponseSchema>;

// =============================================================================
// Error Response Schema
// =============================================================================

export const AttemptErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    'UNAUTHORIZED',
    'INVALID_REQUEST',
    'ASSIGNMENT_NOT_FOUND',
    'MAX_ATTEMPTS_EXCEEDED',
    'ASSIGNMENT_CLOSED',
  ]),
});

export type AttemptError = z.infer<typeof AttemptErrorSchema>;

// =============================================================================
// Examples
// =============================================================================

export const examples = {
  request: {
    section: 'vetrumai',
    assignment_id: null,
    answers: [
      { question_id: '123e4567-e89b-12d3-a456-426614174000', selected_option: 'A' },
      { question_id: '123e4567-e89b-12d3-a456-426614174001', selected_option: 'C' },
    ],
  } satisfies AttemptRequest,

  requestWithAssignment: {
    section: 'vetrumai',
    assignment_id: '123e4567-e89b-12d3-a456-426614174100',
    answers: [
      { question_id: '123e4567-e89b-12d3-a456-426614174000', selected_option: 'A' },
      { question_id: '123e4567-e89b-12d3-a456-426614174001', selected_option: 'C' },
    ],
  } satisfies AttemptRequest,

  response: {
    attempt_id: '123e4567-e89b-12d3-a456-426614174200',
    score: 8,
    total: 10,
    results: [
      {
        question_id: '123e4567-e89b-12d3-a456-426614174000',
        correct: true,
        correct_answer: 'A',
      },
      {
        question_id: '123e4567-e89b-12d3-a456-426614174001',
        correct: false,
        correct_answer: 'B',
      },
    ],
  } satisfies AttemptResponse,

  errorMaxAttempts: {
    error: 'All attempts used. You cannot retry this assignment.',
    code: 'MAX_ATTEMPTS_EXCEEDED',
  } satisfies AttemptError,
};
