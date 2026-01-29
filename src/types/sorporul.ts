/**
 * TypeScript Types: Sorporul (Word Meanings)
 * Feature: 005-sorporul
 *
 * Re-exports Zod-inferred types for convenience.
 */

import type { CSVPreviewResponse as CSVPreviewResponseType } from '@/lib/validators/sorporul';

export type {
  // Common types
  OptionLabel,
  SorporulOption,
  // Student practice
  GetSorporulQuestionsQuery,
  SorporulQuestion,
  GetSorporulQuestionsResponse,
  // Teacher question management
  CreateSorporulQuestionRequest,
  CreateSorporulQuestionResponse,
  ListTeacherQuestionsQuery,
  TeacherQuestion,
  ListTeacherQuestionsResponse,
  UpdateQuestionStatusRequest,
  UpdateQuestionStatusResponse,
  // CSV import
  SorporulCSVRow,
  CSVValidationError,
  CSVPreviewRow,
  CSVPreviewResponse,
  CSVConfirmRequest,
  CSVImportResponse,
  // AI distractor generation
  GenerateDistractorsRequest,
  GenerateDistractorsResponse,
  // Error response
  ErrorResponse,
} from '@/lib/validators/sorporul';

/**
 * Database row types - matching Supabase tables
 */
export interface QuestionRow {
  id: string;
  section: string;
  question_text: string;
  passage_id: string | null;
  status: 'draft' | 'published';
  created_by: string;
  created_at: string;
}

export interface QuestionOptionRow {
  id: string;
  question_id: string;
  option_label: 'A' | 'B' | 'C' | 'D';
  option_text: string;
  is_correct: boolean;
}

/**
 * Joined question with options - for fetching
 */
export interface QuestionWithOptions extends QuestionRow {
  question_options: QuestionOptionRow[];
}

/**
 * Sorporul question display format (client-side)
 */
export interface SorporulQuestionDisplay {
  id: string;
  targetWord: string;
  options: Array<{
    label: 'A' | 'B' | 'C' | 'D';
    text: string;
  }>;
  correctAnswer?: 'A' | 'B' | 'C' | 'D'; // Only visible to teachers
}

/**
 * Practice session state for sorporul
 */
export interface SorporulPracticeState {
  questions: SorporulQuestionDisplay[];
  currentIndex: number;
  answers: Map<string, 'A' | 'B' | 'C' | 'D'>;
  submitted: boolean;
  score?: number;
}

/**
 * Flashcard review state
 */
export interface FlashcardState {
  word: string;
  meaningEn: string | null;
  meaningTa: string | null;
  context: string;
  revealed: boolean;
}

/**
 * CSV import state
 */
export interface CSVImportState {
  file: File | null;
  preview: CSVPreviewResponseType | null;
  importing: boolean;
  error: string | null;
}
