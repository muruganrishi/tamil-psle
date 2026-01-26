/**
 * Teacher practice validators
 * READ-ONLY: Feature agents must not modify this file
 */

import { z } from 'zod';
import {
  PracticeSectionSchema,
  OptionLabelSchema,
  UUIDSchema,
  QuestionMetadataSchema,
  PaginationSchema,
  createPaginatedResponseSchema,
} from './common';

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

/**
 * Option input schema for question creation/update
 */
export const OptionInputSchema = z.object({
  label: OptionLabelSchema,
  text: z.string().min(1, 'Option text is required').max(1000),
  isCorrect: z.boolean(),
});

export type OptionInput = z.infer<typeof OptionInputSchema>;

/**
 * Create question request schema
 */
export const CreateQuestionRequestSchema = z.object({
  section: PracticeSectionSchema,
  questionText: z.string().min(1, 'Question text is required').max(2000),
  options: z
    .array(OptionInputSchema)
    .length(4, 'Exactly 4 options are required')
    .refine(
      (options) => options.filter((o) => o.isCorrect).length === 1,
      'Exactly one option must be marked as correct'
    ),
  passageId: UUIDSchema.nullable().optional(),
  metadata: QuestionMetadataSchema.optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestSchema>;

/**
 * Update question request schema
 */
export const UpdateQuestionRequestSchema = z.object({
  questionText: z.string().min(1).max(2000).optional(),
  options: z
    .array(OptionInputSchema)
    .length(4)
    .refine(
      (options) => options.filter((o) => o.isCorrect).length === 1,
      'Exactly one option must be marked as correct'
    )
    .optional(),
  passageId: UUIDSchema.nullable().optional(),
  metadata: QuestionMetadataSchema.optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export type UpdateQuestionRequest = z.infer<typeof UpdateQuestionRequestSchema>;

/**
 * List questions request schema
 */
export const ListQuestionsRequestSchema = PaginationSchema.extend({
  section: PracticeSectionSchema.optional(),
  status: z.enum(['draft', 'published', 'all']).default('all'),
  search: z.string().max(200).optional(),
  passageId: UUIDSchema.optional(),
});

export type ListQuestionsRequest = z.infer<typeof ListQuestionsRequestSchema>;

/**
 * Question list item schema
 */
export const QuestionListItemSchema = z.object({
  id: UUIDSchema,
  section: PracticeSectionSchema,
  questionText: z.string(),
  status: z.enum(['draft', 'published']),
  passageId: UUIDSchema.nullable(),
  metadata: QuestionMetadataSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type QuestionListItem = z.infer<typeof QuestionListItemSchema>;

/**
 * List questions response schema
 */
export const ListQuestionsResponseSchema = createPaginatedResponseSchema(QuestionListItemSchema);

export type ListQuestionsResponse = z.infer<typeof ListQuestionsResponseSchema>;

// ============================================================================
// BULK IMPORT
// ============================================================================

/**
 * CSV import row schema
 */
export const CSVImportRowSchema = z.object({
  section: PracticeSectionSchema,
  questionText: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: OptionLabelSchema,
  passageTitle: z.string().optional(),
  passageContent: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  tags: z.string().optional(), // Comma-separated
});

export type CSVImportRow = z.infer<typeof CSVImportRowSchema>;

/**
 * Bulk import request schema
 */
export const BulkImportRequestSchema = z.object({
  questions: z.array(CSVImportRowSchema).min(1).max(500),
  publishImmediately: z.boolean().default(false),
});

export type BulkImportRequest = z.infer<typeof BulkImportRequestSchema>;

/**
 * Import result item schema
 */
export const ImportResultItemSchema = z.object({
  row: z.number().int().min(1),
  success: z.boolean(),
  questionId: UUIDSchema.optional(),
  error: z.string().optional(),
});

export type ImportResultItem = z.infer<typeof ImportResultItemSchema>;

/**
 * Bulk import response schema
 */
export const BulkImportResponseSchema = z.object({
  total: z.number().int().min(0),
  successful: z.number().int().min(0),
  failed: z.number().int().min(0),
  results: z.array(ImportResultItemSchema),
});

export type BulkImportResponse = z.infer<typeof BulkImportResponseSchema>;

// ============================================================================
// PASSAGE MANAGEMENT
// ============================================================================

/**
 * Create passage request schema
 */
export const CreatePassageRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  status: z.enum(['draft', 'published']).default('draft'),
});

export type CreatePassageRequest = z.infer<typeof CreatePassageRequestSchema>;

/**
 * Update passage request schema
 */
export const UpdatePassageRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export type UpdatePassageRequest = z.infer<typeof UpdatePassageRequestSchema>;

/**
 * Passage list item schema
 */
export const PassageListItemSchema = z.object({
  id: UUIDSchema,
  title: z.string(),
  status: z.enum(['draft', 'published']),
  questionCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PassageListItem = z.infer<typeof PassageListItemSchema>;

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Section stats schema
 */
export const SectionStatsSchema = z.object({
  section: PracticeSectionSchema,
  totalQuestions: z.number().int().min(0),
  publishedQuestions: z.number().int().min(0),
  totalAttempts: z.number().int().min(0),
  averageScore: z.number().min(0).max(100).nullable(),
});

export type SectionStats = z.infer<typeof SectionStatsSchema>;

/**
 * Question difficulty stats schema
 */
export const QuestionDifficultyStatsSchema = z.object({
  questionId: UUIDSchema,
  attemptCount: z.number().int().min(0),
  correctCount: z.number().int().min(0),
  successRate: z.number().min(0).max(100),
});

export type QuestionDifficultyStats = z.infer<typeof QuestionDifficultyStatsSchema>;

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Teacher API error codes
 */
export const TeacherErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INVALID_REQUEST',
  'NOT_FOUND',
  'QUESTION_NOT_FOUND',
  'PASSAGE_NOT_FOUND',
  'DUPLICATE_QUESTION',
  'IMPORT_FAILED',
  'VALIDATION_ERROR',
  'INTERNAL_ERROR',
]);

export type TeacherErrorCode = z.infer<typeof TeacherErrorCodeSchema>;
