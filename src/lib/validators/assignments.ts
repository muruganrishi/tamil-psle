/**
 * Validators: /api/assignments
 */

import { z } from 'zod';
import { QuestionSectionSchema } from './questions';

export const CreateAssignmentRequestSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  sections: z.array(QuestionSectionSchema).min(1, 'At least one section required'),
  question_count: z.number().int().min(1).max(50).default(10),
  max_attempts: z.number().int().min(1).max(3).default(1),
  due_date: z.string().datetime().nullable(),
});

export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;

export const CreateAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  max_attempts: z.number().int(),
  created_at: z.string().datetime(),
});

export type CreateAssignmentResponse = z.infer<typeof CreateAssignmentResponseSchema>;

export const AttemptSummarySchema = z.object({
  attempt_id: z.string().uuid(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  completed_at: z.string().datetime(),
});

export type AttemptSummary = z.infer<typeof AttemptSummarySchema>;

export const AssignmentDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  sections: z.array(QuestionSectionSchema),
  question_count: z.number().int(),
  max_attempts: z.number().int(),
  attempts_used: z.number().int().min(0),
  due_date: z.string().datetime().nullable(),
  can_retry: z.boolean(),
  attempts: z.array(AttemptSummarySchema),
});

export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;

export const StudentAssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  class_name: z.string(),
  sections: z.array(QuestionSectionSchema),
  question_count: z.number().int(),
  max_attempts: z.number().int(),
  attempts_used: z.number().int().min(0),
  due_date: z.string().datetime().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  best_score: z.number().int().nullable(),
});

export type StudentAssignment = z.infer<typeof StudentAssignmentSchema>;

export const StudentAssignmentListResponseSchema = z.object({
  assignments: z.array(StudentAssignmentSchema),
});

export type StudentAssignmentListResponse = z.infer<typeof StudentAssignmentListResponseSchema>;

export const StudentResultSchema = z.object({
  student_id: z.string().uuid(),
  student_name: z.string().nullable(),
  attempts: z.array(AttemptSummarySchema),
  best_score: z.number().int().nullable(),
  completed: z.boolean(),
});

export type StudentResult = z.infer<typeof StudentResultSchema>;

export const AssignmentResultsResponseSchema = z.object({
  assignment_id: z.string().uuid(),
  title: z.string(),
  class_name: z.string(),
  total_students: z.number().int(),
  completed_count: z.number().int(),
  average_score: z.number().nullable(),
  results: z.array(StudentResultSchema),
});

export type AssignmentResultsResponse = z.infer<typeof AssignmentResultsResponseSchema>;

export const AssignmentErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    'UNAUTHORIZED',
    'INVALID_REQUEST',
    'ASSIGNMENT_NOT_FOUND',
    'CLASS_NOT_FOUND',
    'NOT_CLASS_MEMBER',
    'MAX_ATTEMPTS_EXCEEDED',
  ]),
});

export type AssignmentError = z.infer<typeof AssignmentErrorSchema>;
