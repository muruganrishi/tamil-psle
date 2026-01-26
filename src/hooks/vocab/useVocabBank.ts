'use client';

/**
 * useVocabBank - Hook for vocabulary bank operations
 * READ-ONLY: Feature agents must not modify this file
 *
 * Provides primitives for:
 * - Saving words to vocabulary bank
 * - Listing saved words
 * - Deleting saved words
 * - Managing spaced repetition reviews
 */

import { useState, useCallback } from 'react';
import type { SavedWordDTO, VocabReviewDTO, ReviewResultDTO } from '@/types/practice';

export interface VocabBankState {
  /** Saved words list */
  words: SavedWordDTO[];
  /** Due reviews */
  dueReviews: VocabReviewDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Whether we have more words to load */
  hasMore: boolean;
  /** Cursor for pagination */
  nextCursor: string | null;
}

export interface VocabBankActions {
  /** Load saved words (paginated) */
  loadWords: (options?: { reset?: boolean; search?: string }) => Promise<void>;
  /** Save a new word */
  saveWord: (data: {
    word: string;
    context: string;
    meaningEn?: string | null;
    meaningTa?: string | null;
  }) => Promise<SavedWordDTO | null>;
  /** Delete a saved word */
  deleteWord: (wordId: string) => Promise<boolean>;
  /** Load due reviews */
  loadDueReviews: (limit?: number) => Promise<void>;
  /** Submit a review result */
  submitReview: (review: ReviewResultDTO) => Promise<VocabReviewDTO | null>;
  /** Clear error */
  clearError: () => void;
  /** Reset state */
  reset: () => void;
}

export type UseVocabBankReturn = VocabBankState & VocabBankActions;

const initialState: VocabBankState = {
  words: [],
  dueReviews: [],
  isLoading: false,
  error: null,
  hasMore: false,
  nextCursor: null,
};

/**
 * Hook for vocabulary bank operations
 *
 * @param apiBasePath - Base path for API endpoints (default: '/api')
 * @returns Vocab bank state and actions
 *
 * @example
 * ```tsx
 * const vocab = useVocabBank();
 *
 * // Load saved words
 * await vocab.loadWords();
 *
 * // Save a new word
 * await vocab.saveWord({
 *   word: 'வணக்கம்',
 *   context: 'வணக்கம், நான் பெயர் குமார்',
 *   meaningEn: 'Hello',
 *   meaningTa: 'வரவேற்பு',
 * });
 *
 * // Load due reviews for spaced repetition
 * await vocab.loadDueReviews(10);
 *
 * // Submit review result
 * await vocab.submitReview({ word: 'வணக்கம்', result: 'good' });
 * ```
 */
export function useVocabBank(apiBasePath: string = '/api'): UseVocabBankReturn {
  const [state, setState] = useState<VocabBankState>(initialState);

  // Load saved words (paginated)
  const loadWords = useCallback(
    async (options?: { reset?: boolean; search?: string }) => {
      const reset = options?.reset ?? false;
      const search = options?.search;

      // If not resetting and no more data, skip
      if (!reset && !state.hasMore && state.words.length > 0) {
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        ...(reset ? { words: [], nextCursor: null } : {}),
      }));

      try {
        const params = new URLSearchParams();
        if (!reset && state.nextCursor) {
          params.set('cursor', state.nextCursor);
        }
        if (search) {
          params.set('search', search);
        }
        params.set('limit', '20');

        const response = await fetch(`${apiBasePath}/saved-words?${params.toString()}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load words');
        }

        const data = await response.json();

        // Transform API response to match our DTO format
        const newWords: SavedWordDTO[] = (data.words || []).map(
          (w: {
            id: string;
            word: string;
            context: string;
            meaning_en: string | null;
            meaning_ta: string | null;
            saved_at: string;
          }) => ({
            id: w.id,
            word: w.word,
            context: w.context,
            meaningEn: w.meaning_en,
            meaningTa: w.meaning_ta,
            savedAt: w.saved_at,
          })
        );

        setState((prev) => ({
          ...prev,
          words: reset ? newWords : [...prev.words, ...newWords],
          hasMore: data.hasMore ?? false,
          nextCursor: data.nextCursor ?? null,
          isLoading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load words';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [apiBasePath, state.hasMore, state.nextCursor, state.words.length]
  );

  // Save a new word
  const saveWord = useCallback(
    async (data: {
      word: string;
      context: string;
      meaningEn?: string | null;
      meaningTa?: string | null;
    }): Promise<SavedWordDTO | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${apiBasePath}/saved-words`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: data.word,
            context: data.context,
            meaning_en: data.meaningEn ?? null,
            meaning_ta: data.meaningTa ?? null,
          }),
        });

        if (!response.ok) {
          const responseData = await response.json();
          if (response.status === 409) {
            // Word already saved - not an error
            setState((prev) => ({ ...prev, isLoading: false }));
            return null;
          }
          throw new Error(responseData.error || 'Failed to save word');
        }

        const responseData = await response.json();

        const savedWord: SavedWordDTO = {
          id: responseData.word.id,
          word: responseData.word.word,
          context: responseData.word.context,
          meaningEn: responseData.word.meaning_en,
          meaningTa: responseData.word.meaning_ta,
          savedAt: responseData.word.saved_at,
        };

        setState((prev) => ({
          ...prev,
          words: [savedWord, ...prev.words],
          isLoading: false,
        }));

        return savedWord;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save word';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return null;
      }
    },
    [apiBasePath]
  );

  // Delete a saved word
  const deleteWord = useCallback(
    async (wordId: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${apiBasePath}/saved-words?id=${wordId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete word');
        }

        setState((prev) => ({
          ...prev,
          words: prev.words.filter((w) => w.id !== wordId),
          isLoading: false,
        }));

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete word';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return false;
      }
    },
    [apiBasePath]
  );

  // Load due reviews
  const loadDueReviews = useCallback(
    async (limit: number = 10) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${apiBasePath}/vocab/review?limit=${limit}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load reviews');
        }

        const data = await response.json();

        const reviews: VocabReviewDTO[] = (data.reviews || []).map(
          (r: {
            word: string;
            next_review_at: string;
            interval_days: number;
            ease: number;
            last_result: string | null;
          }) => ({
            word: r.word,
            nextReviewAt: r.next_review_at,
            intervalDays: r.interval_days,
            ease: r.ease,
            lastResult: r.last_result as VocabReviewDTO['lastResult'],
          })
        );

        setState((prev) => ({
          ...prev,
          dueReviews: reviews,
          isLoading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load reviews';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [apiBasePath]
  );

  // Submit a review result
  const submitReview = useCallback(
    async (review: ReviewResultDTO): Promise<VocabReviewDTO | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${apiBasePath}/vocab/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(review),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to submit review');
        }

        const data = await response.json();

        const updatedReview: VocabReviewDTO = {
          word: data.word,
          nextReviewAt: data.next_review_at,
          intervalDays: data.interval_days,
          ease: data.ease,
          lastResult: review.result,
        };

        // Remove from due reviews since it's been reviewed
        setState((prev) => ({
          ...prev,
          dueReviews: prev.dueReviews.filter((r) => r.word !== review.word),
          isLoading: false,
        }));

        return updatedReview;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit review';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return null;
      }
    },
    [apiBasePath]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    loadWords,
    saveWord,
    deleteWord,
    loadDueReviews,
    submitReview,
    clearError,
    reset,
  };
}

export default useVocabBank;
