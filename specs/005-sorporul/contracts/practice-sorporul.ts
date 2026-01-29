/**
 * API Contracts: Sorporul Practice
 * Feature: 005-sorporul
 *
 * These types define the API request/response shapes.
 * Implementation should use Zod schemas that match these types.
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
// GET /api/practice/sorporul/questions
// Fetch sorporul questions for practice
// ============================================================================

export const GetSorporulQuestionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  exclude_ids: z.string().optional(), // comma-separated UUIDs
});
export type GetSorporulQuestionsQuery = z.infer<typeof GetSorporulQuestionsQuerySchema>;

export const SorporulQuestionSchema = z.object({
  id: z.string().uuid(),
  /** The Tamil target word (what student must find meaning for) */
  targetWord: z.string(),
  /** Four Tamil definition options */
  options: z.array(SorporulOptionSchema).length(4),
});
export type SorporulQuestion = z.infer<typeof SorporulQuestionSchema>;

export const GetSorporulQuestionsResponseSchema = z.object({
  questions: z.array(SorporulQuestionSchema),
  totalAvailable: z.number().int().min(0),
});
export type GetSorporulQuestionsResponse = z.infer<typeof GetSorporulQuestionsResponseSchema>;

// ============================================================================
// POST /api/practice/sorporul/questions
// Create a new sorporul question (teacher)
// ============================================================================

export const CreateSorporulQuestionRequestSchema = z.object({
  /** The Tamil target word */
  targetWord: z.string().min(1, 'Target word required'),
  /** The correct Tamil definition */
  correctDefinition: z.string().min(1, 'Correct definition required'),
  /** Three distractor definitions */
  distractors: z.tuple([
    z.string().min(1, 'Distractor 1 required'),
    z.string().min(1, 'Distractor 2 required'),
    z.string().min(1, 'Distractor 3 required'),
  ]),
  /** Which position for correct answer (randomized on server if not specified) */
  correctPosition: OptionLabelSchema.optional(),
  /** Save as draft or publish immediately */
  status: z.enum(['draft', 'published']).default('draft'),
});
export type CreateSorporulQuestionRequest = z.infer<typeof CreateSorporulQuestionRequestSchema>;

export const CreateSorporulQuestionResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published']),
});
export type CreateSorporulQuestionResponse = z.infer<typeof CreateSorporulQuestionResponseSchema>;

// ============================================================================
// GET /api/practice/sorporul/questions (teacher - list own questions)
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
// PATCH /api/practice/sorporul/questions/[id]
// Update question status (publish/unpublish)
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
// Error Response (standard across all endpoints)
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
