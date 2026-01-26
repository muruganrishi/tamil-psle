'use client';

/**
 * usePracticeSession - Hook for managing practice sessions
 * READ-ONLY: Feature agents must not modify this file
 *
 * Provides a generic contract for:
 * - Starting a practice session
 * - Fetching next question
 * - Submitting answers
 * - Getting results
 */

import { useState, useCallback } from 'react';
import type {
  PracticeSection,
  PracticeQuestionDTO,
  AnswerSubmissionDTO,
  AttemptResultDTO,
  OptionLabel,
} from '@/types/practice';

export interface PracticeSessionState {
  /** Current attempt ID */
  attemptId: string | null;
  /** Practice section */
  section: PracticeSection | null;
  /** Current question */
  currentQuestion: PracticeQuestionDTO | null;
  /** Current question number (1-indexed) */
  questionNumber: number;
  /** Total questions in session */
  totalQuestions: number;
  /** Collected answers */
  answers: AnswerSubmissionDTO[];
  /** Session results (after completion) */
  results: AttemptResultDTO | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Session status */
  status: 'idle' | 'active' | 'submitting' | 'completed' | 'error';
}

export interface PracticeSessionActions {
  /** Start a new practice session */
  startSession: (
    section: PracticeSection,
    options?: { assignmentId?: string; questionCount?: number }
  ) => Promise<void>;
  /** Fetch the next question */
  fetchNextQuestion: () => Promise<void>;
  /** Select an answer for current question */
  selectAnswer: (option: OptionLabel) => void;
  /** Submit all answers and complete the session */
  submitAnswers: () => Promise<void>;
  /** Reset the session state */
  reset: () => void;
}

export type UsePracticeSessionReturn = PracticeSessionState & PracticeSessionActions;

const initialState: PracticeSessionState = {
  attemptId: null,
  section: null,
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 0,
  answers: [],
  results: null,
  isLoading: false,
  error: null,
  status: 'idle',
};

/**
 * Hook for managing practice sessions
 *
 * @param apiBasePath - Base path for API endpoints (default: '/api/practice')
 * @returns Session state and actions
 *
 * @example
 * ```tsx
 * const session = usePracticeSession();
 *
 * // Start a session
 * await session.startSession('vetrumai', { questionCount: 10 });
 *
 * // Select an answer
 * session.selectAnswer('A');
 *
 * // Move to next question
 * await session.fetchNextQuestion();
 *
 * // Submit when done
 * await session.submitAnswers();
 * ```
 */
export function usePracticeSession(
  apiBasePath: string = '/api/practice'
): UsePracticeSessionReturn {
  const [state, setState] = useState<PracticeSessionState>(initialState);

  // Start a new practice session
  const startSession = useCallback(
    async (
      section: PracticeSection,
      options?: { assignmentId?: string; questionCount?: number }
    ) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null, status: 'active' }));

      try {
        const response = await fetch(`${apiBasePath}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section,
            assignmentId: options?.assignmentId ?? null,
            questionCount: options?.questionCount ?? 10,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to start session');
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          attemptId: data.attemptId,
          section,
          totalQuestions: data.totalQuestions,
          questionNumber: 0,
          answers: [],
          isLoading: false,
          status: 'active',
        }));

        // Automatically fetch first question
        // This is done in a separate call to allow the state to update first
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start session';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          status: 'error',
        }));
      }
    },
    [apiBasePath]
  );

  // Fetch the next question
  const fetchNextQuestion = useCallback(async () => {
    if (!state.attemptId) {
      setState((prev) => ({ ...prev, error: 'No active session' }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `${apiBasePath}/sessions/${state.attemptId}/next?current=${state.questionNumber}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch question');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        currentQuestion: data.question,
        questionNumber: data.questionNumber,
        totalQuestions: data.totalQuestions,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch question';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
        status: 'error',
      }));
    }
  }, [apiBasePath, state.attemptId, state.questionNumber]);

  // Select an answer for current question
  const selectAnswer = useCallback((option: OptionLabel) => {
    setState((prev) => {
      if (!prev.currentQuestion) return prev;

      const existingIndex = prev.answers.findIndex(
        (a) => a.questionId === prev.currentQuestion?.id
      );

      const newAnswer: AnswerSubmissionDTO = {
        questionId: prev.currentQuestion.id,
        selectedOption: option,
      };

      const newAnswers =
        existingIndex >= 0
          ? prev.answers.map((a, i) => (i === existingIndex ? newAnswer : a))
          : [...prev.answers, newAnswer];

      return { ...prev, answers: newAnswers };
    });
  }, []);

  // Submit all answers and complete the session
  const submitAnswers = useCallback(async () => {
    if (!state.attemptId || state.answers.length === 0) {
      setState((prev) => ({ ...prev, error: 'No answers to submit' }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null, status: 'submitting' }));

    try {
      const response = await fetch(`${apiBasePath}/sessions/${state.attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: state.answers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit answers');
      }

      const data: AttemptResultDTO = await response.json();

      setState((prev) => ({
        ...prev,
        results: data,
        isLoading: false,
        status: 'completed',
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit answers';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
        status: 'error',
      }));
    }
  }, [apiBasePath, state.attemptId, state.answers]);

  // Reset the session state
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    startSession,
    fetchNextQuestion,
    selectAnswer,
    submitAnswers,
    reset,
  };
}

export default usePracticeSession;
