/**
 * Validators: /api/questions
 */

import { z } from 'zod';

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

export const QuestionsQuerySchema = z.object({
  section: QuestionSectionSchema,
  limit: z.coerce.number().int().min(1).max(50).default(10),
  exclude_ids: z.string().optional(),
  assignment_id: z.string().uuid().optional(),
});

export type QuestionsQuery = z.infer<typeof QuestionsQuerySchema>;

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
