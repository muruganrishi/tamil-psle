/**
 * API Contracts: Teacher Sorporul Management
 * Feature: 005-sorporul
 *
 * CSV import and AI distractor generation endpoints.
 */

import { z } from 'zod';
import { OptionLabelSchema } from './practice-sorporul';

// ============================================================================
// POST /api/practice/sorporul/import-csv
// Bulk import questions from CSV
// ============================================================================

/**
 * CSV row validation schema
 * Expected columns: target_word, option_a, option_b, option_c, option_d, correct_answer
 */
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

/**
 * Phase 1: Parse CSV and return preview
 * Request: multipart/form-data with 'file' field
 */
export const CSVPreviewResponseSchema = z.object({
  /** Preview of parsed rows */
  rows: z.array(CSVPreviewRowSchema),
  /** Total rows in file */
  totalRows: z.number().int().min(0),
  /** Number of valid rows */
  validRows: z.number().int().min(0),
  /** Number of rows with errors */
  errorRows: z.number().int().min(0),
  /** Summary of validation errors */
  errors: z.array(CSVValidationErrorSchema),
  /** Upload ID for confirmation step */
  uploadId: z.string(),
});
export type CSVPreviewResponse = z.infer<typeof CSVPreviewResponseSchema>;

/**
 * Phase 2: Confirm import
 */
export const CSVConfirmRequestSchema = z.object({
  uploadId: z.string(),
  /** Import only valid rows, skip errors */
  skipErrors: z.boolean().default(true),
});
export type CSVConfirmRequest = z.infer<typeof CSVConfirmRequestSchema>;

export const CSVImportResponseSchema = z.object({
  /** Number of questions imported */
  imported: z.number().int().min(0),
  /** Number of rows skipped due to errors */
  skipped: z.number().int().min(0),
  /** All imported as draft */
  status: z.literal('draft'),
});
export type CSVImportResponse = z.infer<typeof CSVImportResponseSchema>;

// ============================================================================
// POST /api/practice/sorporul/generate-distractors
// AI-assisted distractor generation
// ============================================================================

export const GenerateDistractorsRequestSchema = z.object({
  /** The Tamil target word */
  targetWord: z.string().min(1, 'Target word required'),
  /** The correct Tamil definition */
  correctDefinition: z.string().min(1, 'Correct definition required'),
});
export type GenerateDistractorsRequest = z.infer<typeof GenerateDistractorsRequestSchema>;

export const GenerateDistractorsResponseSchema = z.object({
  /** Three plausible but incorrect Tamil definitions */
  distractors: z.tuple([z.string(), z.string(), z.string()]),
  /** Whether response was from cache */
  cached: z.boolean().optional(),
});
export type GenerateDistractorsResponse = z.infer<typeof GenerateDistractorsResponseSchema>;

// ============================================================================
// Rate Limit Response
// ============================================================================

export const RateLimitResponseSchema = z.object({
  error: z.literal('Rate limit exceeded'),
  code: z.literal('RATE_LIMITED'),
  retryAfter: z.number().int().min(0), // seconds
});
export type RateLimitResponse = z.infer<typeof RateLimitResponseSchema>;

// ============================================================================
// CSV Format Documentation
// ============================================================================

/**
 * Expected CSV format:
 *
 * target_word,option_a,option_b,option_c,option_d,correct_answer
 * இணங்கினான்,மறுத்தான்,சம்மதித்தான்,எதிர்த்தான்,போசித்தான்,B
 * படித்தான்,பேசினான்,வாசித்தான்,எழுதினான்,ஓடினான்,B
 *
 * Rules:
 * - UTF-8 encoding required for Tamil characters
 * - Header row required (exact column names)
 * - correct_answer must be A, B, C, or D
 * - No empty cells allowed
 * - Max 1000 rows per import
 */
export const CSV_MAX_ROWS = 1000;
export const CSV_REQUIRED_COLUMNS = [
  'target_word',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
] as const;
