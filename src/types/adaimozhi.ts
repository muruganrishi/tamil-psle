/**
 * Adaimozhi database types
 * Feature: 003-adaimozhi
 *
 * These types represent the adaimozhi table structure.
 * They should match the migration in supabase/migrations/008_adaimozhi.sql
 *
 * Note: Once the migration is applied and `supabase gen types typescript` is run,
 * these types will be included in the generated Database type and this file can be removed.
 */

export interface AdaimozhiRow {
  id: string;
  phrase_text: string;
  missing_word: string;
  complete_phrase: string;
  meaning_ta: string | null;
  meaning_en: string | null;
  status: 'draft' | 'published';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AttemptRow {
  id: string;
  user_id: string;
  assignment_id: string | null;
  section: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  total_questions: number;
}

export interface AttemptAnswerRow {
  id: string;
  attempt_id: string;
  question_id: string | null;
  adaimozhi_id: string | null;
  selected_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
}

export interface ProfileRow {
  id: string;
  role: 'student' | 'teacher' | 'admin';
  display_name: string | null;
  ui_language: 'en' | 'ta' | 'both';
  created_at: string;
  updated_at: string;
}
