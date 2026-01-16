/**
 * Validators: Admin API endpoints
 */

import { z } from 'zod';
import { QuestionSectionSchema } from './questions';

export const CSVImportRowSchema = z.object({
  section: QuestionSectionSchema,
  question_text: z.string().min(1),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().min(1),
  option_d: z.string().min(1),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  passage_id: z.string().uuid().optional(),
});

export type CSVImportRow = z.infer<typeof CSVImportRowSchema>;

export const CSVImportErrorSchema = z.object({
  row: z.number().int().min(1),
  error: z.string(),
});

export type CSVImportError = z.infer<typeof CSVImportErrorSchema>;

export const CSVImportResponseSchema = z.object({
  imported: z.number().int().min(0),
  errors: z.array(CSVImportErrorSchema),
  status: z.string(),
});

export type CSVImportResponse = z.infer<typeof CSVImportResponseSchema>;

export const OCRExtractedOptionSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text: z.string(),
});

export type OCRExtractedOption = z.infer<typeof OCRExtractedOptionSchema>;

export const OCRSuccessResponseSchema = z.object({
  extracted: z.literal(true),
  question_text: z.string(),
  options: z.array(OCRExtractedOptionSchema).length(4),
  suggested_correct: z.enum(['A', 'B', 'C', 'D']).nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export type OCRSuccessResponse = z.infer<typeof OCRSuccessResponseSchema>;

export const OCRFailureResponseSchema = z.object({
  extracted: z.literal(false),
  error: z.string(),
});

export type OCRFailureResponse = z.infer<typeof OCRFailureResponseSchema>;

export const OCRResponseSchema = z.union([OCRSuccessResponseSchema, OCRFailureResponseSchema]);

export type OCRResponse = z.infer<typeof OCRResponseSchema>;

export const CreateQuestionRequestSchema = z.object({
  section: QuestionSectionSchema,
  question_text: z.string().min(1, 'Question text is required'),
  options: z
    .array(
      z.object({
        label: z.enum(['A', 'B', 'C', 'D']),
        text: z.string().min(1),
        is_correct: z.boolean(),
      })
    )
    .length(4),
  passage_id: z.string().uuid().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
});

export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestSchema>;

export const CreateQuestionResponseSchema = z.object({
  id: z.string().uuid(),
  section: QuestionSectionSchema,
  status: z.enum(['draft', 'published']),
  created_at: z.string().datetime(),
});

export type CreateQuestionResponse = z.infer<typeof CreateQuestionResponseSchema>;

export const UpdateUserRoleRequestSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['student', 'teacher', 'admin']),
});

export type UpdateUserRoleRequest = z.infer<typeof UpdateUserRoleRequestSchema>;

export const UserListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  role: z.enum(['student', 'teacher', 'admin']),
  created_at: z.string().datetime(),
});

export type UserListItem = z.infer<typeof UserListItemSchema>;

export const UserListResponseSchema = z.object({
  users: z.array(UserListItemSchema),
  total: z.number().int().min(0),
});

export type UserListResponse = z.infer<typeof UserListResponseSchema>;

export const AdminErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    'UNAUTHORIZED',
    'FORBIDDEN',
    'INVALID_REQUEST',
    'RATE_LIMITED',
    'FILE_TOO_LARGE',
    'INVALID_FILE_TYPE',
    'OCR_FAILED',
    'USER_NOT_FOUND',
  ]),
});

export type AdminError = z.infer<typeof AdminErrorSchema>;
