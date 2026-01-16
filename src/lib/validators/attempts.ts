/**
 * Validators: /api/attempts
 */

import { z } from 'zod';
import { QuestionSectionSchema } from './questions';

export const AnswerSubmissionSchema = z.object({
  question_id: z.string().uuid(),
  selected_option: z.enum(['A', 'B', 'C', 'D']),
});

export type AnswerSubmission = z.infer<typeof AnswerSubmissionSchema>;

export const AttemptRequestSchema = z.object({
  section: QuestionSectionSchema,
  assignment_id: z.string().uuid().nullable(),
  answers: z.array(AnswerSubmissionSchema).min(1, 'At least one answer is required'),
});

export type AttemptRequest = z.infer<typeof AttemptRequestSchema>;

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
