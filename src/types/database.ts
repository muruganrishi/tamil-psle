export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'student' | 'teacher' | 'admin';
          display_name: string | null;
          ui_language: 'en' | 'ta' | 'both';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'student' | 'teacher' | 'admin';
          display_name?: string | null;
          ui_language?: 'en' | 'ta' | 'both';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'student' | 'teacher' | 'admin';
          display_name?: string | null;
          ui_language?: 'en' | 'ta' | 'both';
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          join_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          name: string;
          join_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          name?: string;
          join_code?: string;
          created_at?: string;
        };
      };
      class_members: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          joined_at?: string;
        };
      };
      passages: {
        Row: {
          id: string;
          title: string;
          content: string;
          created_by: string;
          status: 'draft' | 'published';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          created_by: string;
          status?: 'draft' | 'published';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          created_by?: string;
          status?: 'draft' | 'published';
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          section:
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu';
          passage_id: string | null;
          question_text: string;
          status: 'draft' | 'published';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section:
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu';
          passage_id?: string | null;
          question_text: string;
          status?: 'draft' | 'published';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section?:
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu';
          passage_id?: string | null;
          question_text?: string;
          status?: 'draft' | 'published';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          option_label: 'A' | 'B' | 'C' | 'D';
          option_text: string;
          is_correct: boolean;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_label: 'A' | 'B' | 'C' | 'D';
          option_text: string;
          is_correct?: boolean;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_label?: 'A' | 'B' | 'C' | 'D';
          option_text?: string;
          is_correct?: boolean;
        };
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          assignment_id: string | null;
          section:
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu';
          started_at: string;
          completed_at: string | null;
          score: number | null;
          total_questions: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          assignment_id?: string | null;
          section:
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu';
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          total_questions: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          assignment_id?: string | null;
          section?:
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu';
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          total_questions?: number;
        };
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option: 'A' | 'B' | 'C' | 'D';
          is_correct: boolean;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option: 'A' | 'B' | 'C' | 'D';
          is_correct: boolean;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_option?: 'A' | 'B' | 'C' | 'D';
          is_correct?: boolean;
        };
      };
      assignments: {
        Row: {
          id: string;
          class_id: string;
          created_by: string;
          title: string;
          sections: (
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu'
          )[];
          question_count: number;
          max_attempts: number;
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          created_by: string;
          title: string;
          sections: (
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu'
          )[];
          question_count: number;
          max_attempts?: number;
          due_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          created_by?: string;
          title?: string;
          sections?: (
            | 'vetrumai'
            | 'seyyul_pazhamozhi'
            | 'adaimozhi_echcham'
            | 'comprehension'
            | 'sorporul'
            | 'oli_verupaadu'
          )[];
          question_count?: number;
          max_attempts?: number;
          due_date?: string | null;
          created_at?: string;
        };
      };
      user_saved_words: {
        Row: {
          id: string;
          user_id: string;
          word: string;
          context: string;
          meaning_en: string | null;
          meaning_ta: string | null;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word: string;
          context: string;
          meaning_en?: string | null;
          meaning_ta?: string | null;
          saved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          word?: string;
          context?: string;
          meaning_en?: string | null;
          meaning_ta?: string | null;
          saved_at?: string;
        };
      };
      word_sense_cache: {
        Row: {
          id: string;
          word_normalized: string;
          context_hash: string;
          language_mode: 'en' | 'ta' | 'both';
          meaning_en: string | null;
          meaning_ta: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          word_normalized: string;
          context_hash: string;
          language_mode: 'en' | 'ta' | 'both';
          meaning_en?: string | null;
          meaning_ta?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          word_normalized?: string;
          context_hash?: string;
          language_mode?: 'en' | 'ta' | 'both';
          meaning_en?: string | null;
          meaning_ta?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'student' | 'teacher' | 'admin';
      language_mode: 'en' | 'ta' | 'both';
      question_section:
        | 'vetrumai'
        | 'seyyul_pazhamozhi'
        | 'adaimozhi_echcham'
        | 'comprehension'
        | 'sorporul'
        | 'oli_verupaadu';
      content_status: 'draft' | 'published';
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Convenience types
export type Profile = Tables<'profiles'>;
export type Class = Tables<'classes'>;
export type ClassMember = Tables<'class_members'>;
export type Passage = Tables<'passages'>;
export type Question = Tables<'questions'>;
export type QuestionOption = Tables<'question_options'>;
export type Attempt = Tables<'attempts'>;
export type AttemptAnswer = Tables<'attempt_answers'>;
export type Assignment = Tables<'assignments'>;
export type UserSavedWord = Tables<'user_saved_words'>;
export type WordSenseCache = Tables<'word_sense_cache'>;

export type UserRole = Enums<'user_role'>;
export type LanguageMode = Enums<'language_mode'>;
export type QuestionSection = Enums<'question_section'>;
export type ContentStatus = Enums<'content_status'>;
