/**
 * API Contracts: Admin endpoints
 * - POST /api/admin/questions/import-csv
 * - POST /api/admin/ocr-assist
 * Auth: Required (admin)
 */

import { z } from 'zod';
import { QuestionSectionSchema } from './questions';

// =============================================================================
// POST /api/admin/questions/import-csv - Bulk import questions
// =============================================================================

// Request is multipart/form-data with CSV file
// CSV columns: section, question_text, option_a, option_b, option_c, option_d, correct_answer

export const CSVImportRowSchema = z.object({
  section: QuestionSectionSchema,
  question_text: z.string().min(1),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().min(1),
  option_d: z.string().min(1),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  passage_id: z.string().uuid().optional(), // For comprehension questions
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

// =============================================================================
// POST /api/admin/ocr-assist - Extract MCQ from image
// Rate Limit: 10/min per user
// =============================================================================

// Request is multipart/form-data with image file (max 5MB)
// Supported formats: PNG, JPG, JPEG, WEBP

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

// =============================================================================
// Admin Question Management
// =============================================================================

export const CreateQuestionRequestSchema = z.object({
  section: QuestionSectionSchema,
  question_text: z.string().min(1, 'Question text is required'),
  options: z.array(
    z.object({
      label: z.enum(['A', 'B', 'C', 'D']),
      text: z.string().min(1),
      is_correct: z.boolean(),
    })
  ).length(4),
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

// =============================================================================
// Admin User Management
// =============================================================================

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

// =============================================================================
// Error Response Schema
// =============================================================================

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

// =============================================================================
// Examples
// =============================================================================

export const examples = {
  csvImportResponse: {
    imported: 25,
    errors: [
      { row: 12, error: 'Missing correct answer indicator' },
      { row: 18, error: 'Invalid section value' },
    ],
    status: 'Questions imported as drafts',
  } satisfies CSVImportResponse,

  ocrSuccessResponse: {
    extracted: true,
    question_text: 'சரியான வேற்றுமை உருபைத் தேர்ந்தெடுக்கவும்',
    options: [
      { label: 'A', text: 'ஐ' },
      { label: 'B', text: 'ஆல்' },
      { label: 'C', text: 'கு' },
      { label: 'D', text: 'இல்' },
    ],
    suggested_correct: 'A',
    confidence: 'high',
  } satisfies OCRSuccessResponse,

  ocrFailureResponse: {
    extracted: false,
    error: 'Could not extract question. Please enter manually or try a clearer image.',
  } satisfies OCRFailureResponse,

  createQuestionRequest: {
    section: 'vetrumai',
    question_text: 'சரியான வேற்றுமை உருபைத் தேர்ந்தெடுக்கவும்',
    options: [
      { label: 'A', text: 'ஐ', is_correct: true },
      { label: 'B', text: 'ஆல்', is_correct: false },
      { label: 'C', text: 'கு', is_correct: false },
      { label: 'D', text: 'இல்', is_correct: false },
    ],
    passage_id: null,
    status: 'draft',
  } satisfies CreateQuestionRequest,

  createQuestionResponse: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    section: 'vetrumai',
    status: 'draft',
    created_at: '2026-01-16T10:00:00Z',
  } satisfies CreateQuestionResponse,

  userListResponse: {
    users: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'teacher@example.com',
        display_name: 'Mrs. Lakshmi',
        role: 'teacher',
        created_at: '2026-01-10T09:00:00Z',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'student@example.com',
        display_name: 'Ravi',
        role: 'student',
        created_at: '2026-01-15T10:00:00Z',
      },
    ],
    total: 2,
  } satisfies UserListResponse,

  errorRateLimited: {
    error: 'Please wait a moment before uploading more images',
    code: 'RATE_LIMITED',
  } satisfies AdminError,

  errorFileTooLarge: {
    error: 'File size exceeds 5MB limit',
    code: 'FILE_TOO_LARGE',
  } satisfies AdminError,
};
