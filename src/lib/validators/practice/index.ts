/**
 * Practice validators - barrel export
 * READ-ONLY: Feature agents must not modify this file
 */

// Common schemas
export {
  PracticeSectionSchema,
  OptionLabelSchema,
  PaginationSchema,
  UUIDSchema,
  QuestionMetadataSchema,
  PracticeOptionSchema,
  PassageSchema,
  PracticeQuestionSchema,
  ApiErrorSchema,
  LanguageModeSchema,
  createPaginatedResponseSchema,
} from './common';

export type {
  PracticeSectionValue,
  OptionLabelValue,
  PaginationParams,
  QuestionMetadataValue,
  PracticeOptionValue,
  PassageValue,
  PracticeQuestionValue,
  ApiErrorValue,
  LanguageModeValue,
} from './common';

// Student schemas
export {
  CreateAttemptRequestSchema,
  AttemptSessionSchema,
  NextQuestionRequestSchema,
  NextQuestionResponseSchema,
  AnswerSubmissionSchema,
  SubmitAnswersRequestSchema,
  QuestionResultSchema,
  AttemptResultResponseSchema,
  SaveWordRequestSchema,
  SavedWordSchema,
  ListSavedWordsRequestSchema,
  ListSavedWordsResponseSchema,
  VocabLookupRequestSchema,
  VocabLookupResponseSchema,
  ReviewResultSchema,
  VocabReviewItemSchema,
  GetDueReviewsRequestSchema,
  SubmitReviewRequestSchema,
  SubmitReviewResponseSchema,
  StudentErrorCodeSchema,
} from './student';

export type {
  CreateAttemptRequest,
  AttemptSession,
  NextQuestionRequest,
  NextQuestionResponse,
  AnswerSubmission,
  SubmitAnswersRequest,
  QuestionResult,
  AttemptResultResponse,
  SaveWordRequest,
  SavedWord,
  ListSavedWordsRequest,
  ListSavedWordsResponse,
  VocabLookupRequest,
  VocabLookupResponse,
  ReviewResult,
  VocabReviewItem,
  GetDueReviewsRequest,
  SubmitReviewRequest,
  SubmitReviewResponse,
  StudentErrorCode,
} from './student';

// Teacher schemas
export {
  OptionInputSchema,
  CreateQuestionRequestSchema,
  UpdateQuestionRequestSchema,
  ListQuestionsRequestSchema,
  QuestionListItemSchema,
  ListQuestionsResponseSchema,
  CSVImportRowSchema,
  BulkImportRequestSchema,
  ImportResultItemSchema,
  BulkImportResponseSchema,
  CreatePassageRequestSchema,
  UpdatePassageRequestSchema,
  PassageListItemSchema,
  SectionStatsSchema,
  QuestionDifficultyStatsSchema,
  TeacherErrorCodeSchema,
} from './teacher';

export type {
  OptionInput,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ListQuestionsRequest,
  QuestionListItem,
  ListQuestionsResponse,
  CSVImportRow,
  BulkImportRequest,
  ImportResultItem,
  BulkImportResponse,
  CreatePassageRequest,
  UpdatePassageRequest,
  PassageListItem,
  SectionStats,
  QuestionDifficultyStats,
  TeacherErrorCode,
} from './teacher';
