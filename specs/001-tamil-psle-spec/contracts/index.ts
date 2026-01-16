/**
 * API Contracts Index
 * TamilPSLE Exam-Prep App
 *
 * This module exports all Zod schemas and TypeScript types for API contracts.
 * Use these for request/response validation in API routes and client code.
 */

// =============================================================================
// Word Meaning API
// =============================================================================
export {
  MeaningRequestSchema,
  MeaningResponseSchema,
  MeaningErrorSchema,
  type MeaningRequest,
  type MeaningResponse,
  type MeaningError,
} from './meaning';

// =============================================================================
// Questions API
// =============================================================================
export {
  QuestionSectionSchema,
  OptionSchema,
  PassageSchema,
  QuestionsQuerySchema,
  QuestionSchema,
  QuestionsResponseSchema,
  type QuestionSection,
  type Option,
  type Passage,
  type QuestionsQuery,
  type Question,
  type QuestionsResponse,
} from './questions';

// =============================================================================
// Attempts API
// =============================================================================
export {
  AnswerSubmissionSchema,
  AttemptRequestSchema,
  QuestionResultSchema,
  AttemptResponseSchema,
  AttemptErrorSchema,
  type AnswerSubmission,
  type AttemptRequest,
  type QuestionResult,
  type AttemptResponse,
  type AttemptError,
} from './attempts';

// =============================================================================
// Saved Words API
// =============================================================================
export {
  SaveWordRequestSchema,
  SaveWordResponseSchema,
  SavedWordSchema,
  SavedWordsListResponseSchema,
  DeleteWordRequestSchema,
  SavedWordErrorSchema,
  type SaveWordRequest,
  type SaveWordResponse,
  type SavedWord,
  type SavedWordsListResponse,
  type DeleteWordRequest,
  type SavedWordError,
} from './saved-words';

// =============================================================================
// Classes API
// =============================================================================
export {
  CreateClassRequestSchema,
  CreateClassResponseSchema,
  JoinClassRequestSchema,
  JoinClassResponseSchema,
  ClassSummarySchema,
  ClassListResponseSchema,
  StudentMemberSchema,
  ClassDetailResponseSchema,
  ClassErrorSchema,
  type CreateClassRequest,
  type CreateClassResponse,
  type JoinClassRequest,
  type JoinClassResponse,
  type ClassSummary,
  type ClassListResponse,
  type StudentMember,
  type ClassDetailResponse,
  type ClassError,
} from './classes';

// =============================================================================
// Assignments API
// =============================================================================
export {
  CreateAssignmentRequestSchema,
  CreateAssignmentResponseSchema,
  AttemptSummarySchema,
  AssignmentDetailResponseSchema,
  StudentAssignmentSchema,
  StudentAssignmentListResponseSchema,
  StudentResultSchema,
  AssignmentResultsResponseSchema,
  AssignmentErrorSchema,
  type CreateAssignmentRequest,
  type CreateAssignmentResponse,
  type AttemptSummary,
  type AssignmentDetailResponse,
  type StudentAssignment,
  type StudentAssignmentListResponse,
  type StudentResult,
  type AssignmentResultsResponse,
  type AssignmentError,
} from './assignments';

// =============================================================================
// Admin API
// =============================================================================
export {
  CSVImportRowSchema,
  CSVImportErrorSchema,
  CSVImportResponseSchema,
  OCRExtractedOptionSchema,
  OCRSuccessResponseSchema,
  OCRFailureResponseSchema,
  OCRResponseSchema,
  CreateQuestionRequestSchema,
  CreateQuestionResponseSchema,
  UpdateUserRoleRequestSchema,
  UserListItemSchema,
  UserListResponseSchema,
  AdminErrorSchema,
  type CSVImportRow,
  type CSVImportError,
  type CSVImportResponse,
  type OCRExtractedOption,
  type OCRSuccessResponse,
  type OCRFailureResponse,
  type OCRResponse,
  type CreateQuestionRequest,
  type CreateQuestionResponse,
  type UpdateUserRoleRequest,
  type UserListItem,
  type UserListResponse,
  type AdminError,
} from './admin';
