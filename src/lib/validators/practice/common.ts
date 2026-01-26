/**
 * Common practice validators
 * READ-ONLY: Feature agents must not modify this file
 */

import { z } from 'zod';

/**
 * Practice section enum schema
 */
export const PracticeSectionSchema = z.enum([
  'vetrumai',
  'pazhamozhi',
  'adaimozhi',
  'munnunarvu',
  'sorporul',
  'oli-verupaadu',
]);

export type PracticeSectionValue = z.infer<typeof PracticeSectionSchema>;

/**
 * Option label schema (A-D)
 */
export const OptionLabelSchema = z.enum(['A', 'B', 'C', 'D']);

export type OptionLabelValue = z.infer<typeof OptionLabelSchema>;

/**
 * Pagination schema (cursor-based)
 */
export const PaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Paginated response schema factory
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().uuid().nullable(),
    hasMore: z.boolean(),
    total: z.number().int().min(0).optional(),
  });
}

/**
 * UUID schema with validation message
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format');

/**
 * Question metadata schema
 */
export const QuestionMetadataSchema = z
  .object({
    difficulty: z.number().int().min(1).max(5).optional(),
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
  })
  .passthrough(); // Allow additional section-specific fields

export type QuestionMetadataValue = z.infer<typeof QuestionMetadataSchema>;

/**
 * Practice option schema
 */
export const PracticeOptionSchema = z.object({
  label: OptionLabelSchema,
  text: z.string().min(1, 'Option text is required'),
});

export type PracticeOptionValue = z.infer<typeof PracticeOptionSchema>;

/**
 * Passage schema
 */
export const PassageSchema = z.object({
  id: UUIDSchema,
  title: z.string().min(1),
  content: z.string().min(1),
});

export type PassageValue = z.infer<typeof PassageSchema>;

/**
 * Practice question schema
 */
export const PracticeQuestionSchema = z.object({
  id: UUIDSchema,
  section: PracticeSectionSchema,
  questionText: z.string().min(1),
  options: z.array(PracticeOptionSchema).length(4).nullable(),
  passage: PassageSchema.nullable(),
  metadata: QuestionMetadataSchema,
});

export type PracticeQuestionValue = z.infer<typeof PracticeQuestionSchema>;

/**
 * Standard API error response schema
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.unknown().optional(),
});

export type ApiErrorValue = z.infer<typeof ApiErrorSchema>;

/**
 * Language mode schema
 */
export const LanguageModeSchema = z.enum(['en', 'ta', 'both']);

export type LanguageModeValue = z.infer<typeof LanguageModeSchema>;
