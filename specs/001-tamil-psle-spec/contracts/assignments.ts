/**
 * API Contract: /api/assignments
 * Purpose: Create and manage assignments
 * Auth: Required (teacher for create, student/teacher for view)
 * Methods: POST, GET
 */

import { z } from 'zod';
import { QuestionSectionSchema } from './questions';

// =============================================================================
// POST /api/assignments - Create assignment (Teacher)
// =============================================================================

export const CreateAssignmentRequestSchema = z.object({
  /** Target class ID */
  class_id: z.string().uuid(),

  /** Assignment title */
  title: z.string().min(1, 'Title is required').max(200),

  /** Sections to include */
  sections: z.array(QuestionSectionSchema).min(1, 'At least one section required'),

  /** Number of questions */
  question_count: z.number().int().min(1).max(50).default(10),

  /** Maximum attempts allowed (1-3) */
  max_attempts: z.number().int().min(1).max(3).default(1),

  /** Optional due date */
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

// =============================================================================
// GET /api/assignments/:id - Assignment details
// =============================================================================

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

// =============================================================================
// GET /api/assignments - List assignments for student
// =============================================================================

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

export type StudentAssignmentListResponse = z.infer<
  typeof StudentAssignmentListResponseSchema
>;

// =============================================================================
// Teacher Results View - GET /api/assignments/:id/results
// =============================================================================

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

// =============================================================================
// Error Response Schema
// =============================================================================

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

// =============================================================================
// Examples
// =============================================================================

export const examples = {
  createRequest: {
    class_id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Week 1 - Vetrumai Practice',
    sections: ['vetrumai'],
    question_count: 10,
    max_attempts: 2,
    due_date: '2026-01-23T23:59:00Z',
  } satisfies CreateAssignmentRequest,

  createResponse: {
    id: '123e4567-e89b-12d3-a456-426614174100',
    title: 'Week 1 - Vetrumai Practice',
    max_attempts: 2,
    created_at: '2026-01-16T10:00:00Z',
  } satisfies CreateAssignmentResponse,

  assignmentDetail: {
    id: '123e4567-e89b-12d3-a456-426614174100',
    title: 'Week 1 - Vetrumai Practice',
    sections: ['vetrumai'],
    question_count: 10,
    max_attempts: 2,
    attempts_used: 1,
    due_date: '2026-01-23T23:59:00Z',
    can_retry: true,
    attempts: [
      {
        attempt_id: '123e4567-e89b-12d3-a456-426614174200',
        score: 7,
        total: 10,
        completed_at: '2026-01-17T14:30:00Z',
      },
    ],
  } satisfies AssignmentDetailResponse,

  studentListResponse: {
    assignments: [
      {
        id: '123e4567-e89b-12d3-a456-426614174100',
        title: 'Week 1 - Vetrumai Practice',
        class_name: 'P6 Tamil 2026',
        sections: ['vetrumai'],
        question_count: 10,
        max_attempts: 2,
        attempts_used: 0,
        due_date: '2026-01-23T23:59:00Z',
        status: 'pending',
        best_score: null,
      },
    ],
  } satisfies StudentAssignmentListResponse,

  teacherResultsResponse: {
    assignment_id: '123e4567-e89b-12d3-a456-426614174100',
    title: 'Week 1 - Vetrumai Practice',
    class_name: 'P6 Tamil 2026',
    total_students: 25,
    completed_count: 20,
    average_score: 7.5,
    results: [
      {
        student_id: '123e4567-e89b-12d3-a456-426614174300',
        student_name: 'Ravi',
        attempts: [
          {
            attempt_id: '123e4567-e89b-12d3-a456-426614174200',
            score: 7,
            total: 10,
            completed_at: '2026-01-17T14:30:00Z',
          },
          {
            attempt_id: '123e4567-e89b-12d3-a456-426614174201',
            score: 9,
            total: 10,
            completed_at: '2026-01-18T10:00:00Z',
          },
        ],
        best_score: 9,
        completed: true,
      },
    ],
  } satisfies AssignmentResultsResponse,

  errorMaxAttempts: {
    error: 'All attempts used. You cannot retry this assignment.',
    code: 'MAX_ATTEMPTS_EXCEEDED',
  } satisfies AssignmentError,
};
