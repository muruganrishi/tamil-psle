/**
 * Practice content DTOs
 * READ-ONLY: Feature agents must not modify this file
 */

import type { PracticeSection } from './sections';

/**
 * Option label type (A-D for MCQ)
 */
export type OptionLabel = 'A' | 'B' | 'C' | 'D';

/**
 * MCQ option data transfer object
 */
export interface PracticeOptionDTO {
  /** Option label (A, B, C, D) */
  label: OptionLabel;
  /** Option text content */
  text: string;
}

/**
 * Question metadata - extensible per section
 */
export interface QuestionMetadata {
  /** Difficulty level (1-5) */
  difficulty?: number;
  /** Topic/subtopic tags */
  tags?: string[];
  /** Source reference (textbook, year, etc.) */
  source?: string;
  /** Section-specific data */
  [key: string]: unknown;
}

/**
 * Passage data transfer object (for comprehension questions)
 */
export interface PassageDTO {
  /** Unique passage ID */
  id: string;
  /** Passage title */
  title: string;
  /** Passage content (Tamil text) */
  content: string;
}

/**
 * Generic practice question data transfer object
 * Used for fetching questions to display to students
 */
export interface PracticeQuestionDTO {
  /** Unique question ID */
  id: string;
  /** Practice section this question belongs to */
  section: PracticeSection;
  /** Question text (Tamil) */
  questionText: string;
  /** MCQ options (null for non-MCQ question types) */
  options: PracticeOptionDTO[] | null;
  /** Associated passage (for comprehension) */
  passage: PassageDTO | null;
  /** Question metadata */
  metadata: QuestionMetadata;
}

/**
 * Response when fetching the next question(s)
 */
export interface NextQuestionResponseDTO {
  /** The question to display */
  question: PracticeQuestionDTO;
  /** Current question number in session (1-indexed) */
  questionNumber: number;
  /** Total questions in session */
  totalQuestions: number;
  /** Whether this is the last question */
  isLast: boolean;
}

/**
 * Student's answer submission
 */
export interface AnswerSubmissionDTO {
  /** Question ID being answered */
  questionId: string;
  /** Selected option (for MCQ) */
  selectedOption: OptionLabel;
}

/**
 * Result for a single answered question
 */
export interface QuestionResultDTO {
  /** Question ID */
  questionId: string;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** The correct answer */
  correctOption: OptionLabel;
  /** Student's selected option */
  selectedOption: OptionLabel;
}

/**
 * Create attempt request
 */
export interface CreateAttemptDTO {
  /** Section to practice */
  section: PracticeSection;
  /** Assignment ID if practicing assigned work */
  assignmentId?: string | null;
  /** Number of questions requested */
  questionCount?: number;
}

/**
 * Attempt session data
 */
export interface AttemptSessionDTO {
  /** Attempt ID */
  id: string;
  /** User ID */
  userId: string;
  /** Practice section */
  section: PracticeSection;
  /** Assignment ID if assigned */
  assignmentId: string | null;
  /** When attempt started */
  startedAt: string;
  /** When attempt completed (null if in progress) */
  completedAt: string | null;
  /** Score (null if not completed) */
  score: number | null;
  /** Total questions in attempt */
  totalQuestions: number;
}

/**
 * Submit answers and complete attempt request
 */
export interface SubmitAttemptDTO {
  /** Attempt ID */
  attemptId: string;
  /** All answers for the attempt */
  answers: AnswerSubmissionDTO[];
}

/**
 * Attempt completion response
 */
export interface AttemptResultDTO {
  /** Attempt ID */
  attemptId: string;
  /** Final score (correct answers) */
  score: number;
  /** Total questions */
  total: number;
  /** Per-question results */
  results: QuestionResultDTO[];
  /** Completion time */
  completedAt: string;
}

/**
 * Saved vocabulary word DTO
 */
export interface SavedWordDTO {
  /** Unique ID */
  id: string;
  /** The Tamil word */
  word: string;
  /** Context where the word was found */
  context: string;
  /** English meaning */
  meaningEn: string | null;
  /** Tamil meaning/synonym */
  meaningTa: string | null;
  /** When the word was saved */
  savedAt: string;
}

/**
 * Vocabulary review item DTO
 */
export interface VocabReviewDTO {
  /** The word being reviewed */
  word: string;
  /** Next scheduled review time */
  nextReviewAt: string;
  /** Current interval in days */
  intervalDays: number;
  /** Ease factor for spaced repetition */
  ease: number;
  /** Result of last review */
  lastResult: 'easy' | 'good' | 'hard' | 'again' | null;
}

/**
 * Review result submission
 */
export interface ReviewResultDTO {
  /** Word being reviewed */
  word: string;
  /** Review result */
  result: 'easy' | 'good' | 'hard' | 'again';
}
