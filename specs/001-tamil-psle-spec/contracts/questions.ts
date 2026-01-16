/**
 * API Contract: /api/questions
 * Purpose: Fetch questions for practice
 * Auth: Required (any role)
 * Method: GET
 */

import { z } from 'zod';

// =============================================================================
// Shared Types
// =============================================================================

export const QuestionSectionSchema = z.enum([
  'vetrumai',
  'seyyul_pazhamozhi',
  'adaimozhi_echcham',
  'comprehension',
  'sorporul',
  'oli_verupaadu',
]);

export type QuestionSection = z.infer<typeof QuestionSectionSchema>;

export const OptionSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text: z.string(),
});

export type Option = z.infer<typeof OptionSchema>;

export const PassageSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
});

export type Passage = z.infer<typeof PassageSchema>;

// =============================================================================
// Request Schema (Query Parameters)
// =============================================================================

export const QuestionsQuerySchema = z.object({
  /** Section to fetch questions from (required) */
  section: QuestionSectionSchema,

  /** Number of questions to return (default: 10, max: 50) */
  limit: z.coerce.number().int().min(1).max(50).default(10),

  /** Question IDs to exclude (comma-separated) */
  exclude_ids: z.string().optional(),

  /** Assignment ID for adaptive selection context */
  assignment_id: z.string().uuid().optional(),
});

export type QuestionsQuery = z.infer<typeof QuestionsQuerySchema>;

// =============================================================================
// Response Schema
// =============================================================================

export const QuestionSchema = z.object({
  id: z.string().uuid(),
  section: QuestionSectionSchema,
  question_text: z.string(),
  options: z.array(OptionSchema).length(4),
  passage: PassageSchema.nullable(),
});

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema),
  total_available: z.number().int().min(0),
});

export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;

// =============================================================================
// Examples
// =============================================================================

export const examples = {
  query: {
    section: 'vetrumai',
    limit: 10,
  } satisfies QuestionsQuery,

  response: {
    questions: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        section: 'vetrumai',
        question_text: 'சரியான வேற்றுமை உருபைத் தேர்ந்தெடுக்கவும்',
        options: [
          { label: 'A', text: 'ஐ' },
          { label: 'B', text: 'ஆல்' },
          { label: 'C', text: 'கு' },
          { label: 'D', text: 'இல்' },
        ],
        passage: null,
      },
    ],
    total_available: 45,
  } satisfies QuestionsResponse,

  responseWithPassage: {
    questions: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        section: 'comprehension',
        question_text: 'மேலே உள்ள பத்தியின் தலைப்பு என்ன?',
        options: [
          { label: 'A', text: 'காட்டு விலங்குகள்' },
          { label: 'B', text: 'வீட்டு விலங்குகள்' },
          { label: 'C', text: 'கடல் விலங்குகள்' },
          { label: 'D', text: 'பறவைகள்' },
        ],
        passage: {
          id: '123e4567-e89b-12d3-a456-426614174010',
          title: 'விலங்குகள்',
          content:
            'விலங்குகள் பல வகைகளாகப் பிரிக்கப்படுகின்றன. வீட்டு விலங்குகள், காட்டு விலங்குகள் என்று பிரிக்கலாம்.',
        },
      },
    ],
    total_available: 20,
  } satisfies QuestionsResponse,
};
