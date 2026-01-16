/**
 * API Contract: /api/classes
 * Purpose: Create and manage classes
 * Auth: Required (teacher for create, student for join)
 * Methods: POST, GET
 */

import { z } from 'zod';

// =============================================================================
// POST /api/classes - Create a class (Teacher)
// =============================================================================

export const CreateClassRequestSchema = z.object({
  /** Class name */
  name: z.string().min(1, 'Class name is required').max(100),
});

export type CreateClassRequest = z.infer<typeof CreateClassRequestSchema>;

export const CreateClassResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  join_code: z.string().length(6),
});

export type CreateClassResponse = z.infer<typeof CreateClassResponseSchema>;

// =============================================================================
// POST /api/classes/join - Join a class (Student)
// =============================================================================

export const JoinClassRequestSchema = z.object({
  /** 6-character alphanumeric join code */
  join_code: z
    .string()
    .length(6, 'Join code must be 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Join code must be alphanumeric'),
});

export type JoinClassRequest = z.infer<typeof JoinClassRequestSchema>;

export const JoinClassResponseSchema = z.object({
  class_id: z.string().uuid(),
  class_name: z.string(),
  teacher_name: z.string().nullable(),
});

export type JoinClassResponse = z.infer<typeof JoinClassResponseSchema>;

// =============================================================================
// GET /api/classes - List classes
// =============================================================================

export const ClassSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  join_code: z.string().length(6).optional(), // Only for teachers
  teacher_name: z.string().nullable().optional(), // Only for students
  student_count: z.number().int().min(0).optional(), // Only for teachers
  joined_at: z.string().datetime().optional(), // Only for students
  created_at: z.string().datetime(),
});

export type ClassSummary = z.infer<typeof ClassSummarySchema>;

export const ClassListResponseSchema = z.object({
  classes: z.array(ClassSummarySchema),
});

export type ClassListResponse = z.infer<typeof ClassListResponseSchema>;

// =============================================================================
// GET /api/classes/:id - Class details with roster (Teacher)
// =============================================================================

export const StudentMemberSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().nullable(),
  email: z.string().email(),
  joined_at: z.string().datetime(),
});

export type StudentMember = z.infer<typeof StudentMemberSchema>;

export const ClassDetailResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  join_code: z.string().length(6),
  created_at: z.string().datetime(),
  students: z.array(StudentMemberSchema),
  assignment_count: z.number().int().min(0),
});

export type ClassDetailResponse = z.infer<typeof ClassDetailResponseSchema>;

// =============================================================================
// Error Response Schema
// =============================================================================

export const ClassErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    'UNAUTHORIZED',
    'INVALID_REQUEST',
    'CLASS_NOT_FOUND',
    'INVALID_JOIN_CODE',
    'ALREADY_MEMBER',
    'NOT_TEACHER',
    'HAS_ACTIVE_ASSIGNMENTS',
  ]),
});

export type ClassError = z.infer<typeof ClassErrorSchema>;

// =============================================================================
// Examples
// =============================================================================

export const examples = {
  createRequest: {
    name: 'P6 Tamil 2026',
  } satisfies CreateClassRequest,

  createResponse: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'P6 Tamil 2026',
    join_code: 'ABC123',
  } satisfies CreateClassResponse,

  joinRequest: {
    join_code: 'ABC123',
  } satisfies JoinClassRequest,

  joinResponse: {
    class_id: '123e4567-e89b-12d3-a456-426614174000',
    class_name: 'P6 Tamil 2026',
    teacher_name: 'Mrs. Lakshmi',
  } satisfies JoinClassResponse,

  teacherListResponse: {
    classes: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'P6 Tamil 2026',
        join_code: 'ABC123',
        student_count: 25,
        created_at: '2026-01-15T09:00:00Z',
      },
    ],
  } satisfies ClassListResponse,

  studentListResponse: {
    classes: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'P6 Tamil 2026',
        teacher_name: 'Mrs. Lakshmi',
        joined_at: '2026-01-16T10:00:00Z',
        created_at: '2026-01-15T09:00:00Z',
      },
    ],
  } satisfies ClassListResponse,

  classDetail: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'P6 Tamil 2026',
    join_code: 'ABC123',
    created_at: '2026-01-15T09:00:00Z',
    students: [
      {
        id: '123e4567-e89b-12d3-a456-426614174100',
        display_name: 'Ravi',
        email: 'ravi@example.com',
        joined_at: '2026-01-16T10:00:00Z',
      },
    ],
    assignment_count: 3,
  } satisfies ClassDetailResponse,

  errorInvalidCode: {
    error: 'Invalid join code. Please check with your teacher.',
    code: 'INVALID_JOIN_CODE',
  } satisfies ClassError,

  errorAlreadyMember: {
    error: 'You are already a member of this class.',
    code: 'ALREADY_MEMBER',
  } satisfies ClassError,
};
