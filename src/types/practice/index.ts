/**
 * Practice module types - barrel export
 * READ-ONLY: Feature agents must not modify this file
 */

// Section types and utilities
export type { PracticeSection } from './sections';
export {
  PRACTICE_SECTIONS,
  SECTION_LABELS_EN,
  SECTION_LABELS_TA,
  isPracticeSection,
} from './sections';

// Content DTOs
export type { OptionLabel } from './content';
export type {
  PracticeOptionDTO,
  QuestionMetadata,
  PassageDTO,
  PracticeQuestionDTO,
  NextQuestionResponseDTO,
  AnswerSubmissionDTO,
  QuestionResultDTO,
  CreateAttemptDTO,
  AttemptSessionDTO,
  SubmitAttemptDTO,
  AttemptResultDTO,
  SavedWordDTO,
  VocabReviewDTO,
  ReviewResultDTO,
} from './content';
