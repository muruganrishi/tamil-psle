/**
 * Zod Validation Schemas: Sorporul (Word Meanings)
 * Feature: 005-sorporul
 */

import { z } from 'zod';

// ============================================================================
// Common Types
// ============================================================================

export const OptionLabelSchema = z.enum(['A', 'B', 'C', 'D']);
export type OptionLabel = z.infer<typeof OptionLabelSchema>;

export const SorporulOptionSchema = z.object({
  label: OptionLabelSchema,
  text: z.string().min(1, 'Option text required'),
});
export type SorporulOption = z.infer<typeof SorporulOptionSchema>;

// ============================================================================
// GET /api/practice/sorporul/questions - Student practice
// ============================================================================

export const GetSorporulQuestionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  exclude_ids: z.string().optional(),
});
export type GetSorporulQuestionsQuery = z.infer<typeof GetSorporulQuestionsQuerySchema>;

export const SorporulQuestionSchema = z.object({
  id: z.string().uuid(),
  targetWord: z.string(),
  options: z.array(SorporulOptionSchema).length(4),
});
export type SorporulQuestion = z.infer<typeof SorporulQuestionSchema>;

export const GetSorporulQuestionsResponseSchema = z.object({
  questions: z.array(SorporulQuestionSchema),
  totalAvailable: z.number().int().min(0),
});
export type GetSorporulQuestionsResponse = z.infer<typeof GetSorporulQuestionsResponseSchema>;

// ============================================================================
// POST /api/practice/sorporul/questions - Teacher create question
// ============================================================================

export const CreateSorporulQuestionRequestSchema = z.object({
  targetWord: z.string().min(1, 'Target word required'),
  correctDefinition: z.string().min(1, 'Correct definition required'),
  distractors: z.tuple([
    z.string().min(1, 'Distractor 1 required'),
    z.string().min(1, 'Distractor 2 required'),
    z.string().min(1, 'Distractor 3 required'),
  ]),
  correctPosition: OptionLabelSchema.optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});
export type CreateSorporulQuestionRequest = z.infer<typeof CreateSorporulQuestionRequestSchema>;

export const CreateSorporulQuestionResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published']),
});
export type CreateSorporulQuestionResponse = z.infer<typeof CreateSorporulQuestionResponseSchema>;

// ============================================================================
// GET /api/practice/sorporul/questions - Teacher list
// ============================================================================

export const ListTeacherQuestionsQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListTeacherQuestionsQuery = z.infer<typeof ListTeacherQuestionsQuerySchema>;

export const TeacherQuestionSchema = z.object({
  id: z.string().uuid(),
  targetWord: z.string(),
  options: z.array(SorporulOptionSchema).length(4),
  correctAnswer: OptionLabelSchema,
  status: z.enum(['draft', 'published']),
  createdAt: z.string().datetime(),
});
export type TeacherQuestion = z.infer<typeof TeacherQuestionSchema>;

export const ListTeacherQuestionsResponseSchema = z.object({
  questions: z.array(TeacherQuestionSchema),
  total: z.number().int().min(0),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type ListTeacherQuestionsResponse = z.infer<typeof ListTeacherQuestionsResponseSchema>;

// ============================================================================
// PATCH /api/practice/sorporul/questions/[id] - Update status
// ============================================================================

export const UpdateQuestionStatusRequestSchema = z.object({
  status: z.enum(['draft', 'published']),
});
export type UpdateQuestionStatusRequest = z.infer<typeof UpdateQuestionStatusRequestSchema>;

export const UpdateQuestionStatusResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published']),
});
export type UpdateQuestionStatusResponse = z.infer<typeof UpdateQuestionStatusResponseSchema>;

// ============================================================================
// CSV Import Schemas
// ============================================================================

export const SorporulCSVRowSchema = z.object({
  target_word: z.string().min(1, 'Target word required'),
  option_a: z.string().min(1, 'Option A required'),
  option_b: z.string().min(1, 'Option B required'),
  option_c: z.string().min(1, 'Option C required'),
  option_d: z.string().min(1, 'Option D required'),
  correct_answer: OptionLabelSchema,
});
export type SorporulCSVRow = z.infer<typeof SorporulCSVRowSchema>;

export const CSVValidationErrorSchema = z.object({
  row: z.number().int().min(1),
  column: z.string().optional(),
  error: z.string(),
});
export type CSVValidationError = z.infer<typeof CSVValidationErrorSchema>;

export const CSVPreviewRowSchema = z.object({
  row: z.number().int().min(1),
  targetWord: z.string(),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }),
  correctAnswer: OptionLabelSchema,
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
});
export type CSVPreviewRow = z.infer<typeof CSVPreviewRowSchema>;

export const CSVPreviewResponseSchema = z.object({
  rows: z.array(CSVPreviewRowSchema),
  totalRows: z.number().int().min(0),
  validRows: z.number().int().min(0),
  errorRows: z.number().int().min(0),
  errors: z.array(CSVValidationErrorSchema),
  uploadId: z.string(),
});
export type CSVPreviewResponse = z.infer<typeof CSVPreviewResponseSchema>;

export const CSVConfirmRequestSchema = z.object({
  uploadId: z.string(),
  skipErrors: z.boolean().default(true),
});
export type CSVConfirmRequest = z.infer<typeof CSVConfirmRequestSchema>;

export const CSVImportResponseSchema = z.object({
  imported: z.number().int().min(0),
  skipped: z.number().int().min(0),
  status: z.literal('draft'),
});
export type CSVImportResponse = z.infer<typeof CSVImportResponseSchema>;

// ============================================================================
// AI Distractor Generation Schemas
// ============================================================================

export const GenerateDistractorsRequestSchema = z.object({
  targetWord: z.string().min(1, 'Target word required'),
  correctDefinition: z.string().min(1, 'Correct definition required'),
});
export type GenerateDistractorsRequest = z.infer<typeof GenerateDistractorsRequestSchema>;

export const GenerateDistractorsResponseSchema = z.object({
  distractors: z.tuple([z.string(), z.string(), z.string()]),
  cached: z.boolean().optional(),
});
export type GenerateDistractorsResponse = z.infer<typeof GenerateDistractorsResponseSchema>;

// ============================================================================
// Constants
// ============================================================================

export const CSV_MAX_ROWS = 1000;
export const CSV_REQUIRED_COLUMNS = [
  'target_word',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
] as const;

// ============================================================================
// Error Response
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
