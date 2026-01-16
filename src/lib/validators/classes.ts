/**
 * Validators: /api/classes
 */

import { z } from 'zod';

export const CreateClassRequestSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100),
});

export type CreateClassRequest = z.infer<typeof CreateClassRequestSchema>;

export const CreateClassResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  join_code: z.string().length(6),
});

export type CreateClassResponse = z.infer<typeof CreateClassResponseSchema>;

export const JoinClassRequestSchema = z.object({
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

export const ClassSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  join_code: z.string().length(6).optional(),
  teacher_name: z.string().nullable().optional(),
  student_count: z.number().int().min(0).optional(),
  joined_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
});

export type ClassSummary = z.infer<typeof ClassSummarySchema>;

export const ClassListResponseSchema = z.object({
  classes: z.array(ClassSummarySchema),
});

export type ClassListResponse = z.infer<typeof ClassListResponseSchema>;

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
