'use client';

/**
 * useGeminiCached - Hook for cached Gemini AI operations
 * READ-ONLY: Feature agents must not modify this file
 *
 * Provides a generic wrapper for AI operations with:
 * - Automatic DB-level caching
 * - Rate limiting awareness
 * - Error handling
 */

import { useState, useCallback, useRef } from 'react';
import type { LanguageMode } from '@/types/database';

export interface GeminiResult<T> {
  data: T | null;
  cached: boolean;
  error: string | null;
}

export interface UseGeminiCachedState {
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error message from last request */
  error: string | null;
  /** Whether rate limited */
  isRateLimited: boolean;
  /** Seconds until rate limit resets */
  retryAfter: number | null;
}

export interface UseGeminiCachedActions {
  /** Look up word meaning with context */
  lookupMeaning: (
    word: string,
    context: string,
    languageMode?: LanguageMode
  ) => Promise<GeminiResult<{ meaningEn: string | null; meaningTa: string | null }>>;
  /** Generic cached AI call */
  cachedCall: <T>(
    task: string,
    input: Record<string, unknown>,
    fetcher: () => Promise<T>
  ) => Promise<GeminiResult<T>>;
  /** Clear error state */
  clearError: () => void;
}

export type UseGeminiCachedReturn = UseGeminiCachedState & UseGeminiCachedActions;

/**
 * Hook for cached Gemini AI operations
 *
 * @param apiBasePath - Base path for API endpoints (default: '/api')
 * @returns State and actions for AI operations
 *
 * @example
 * ```tsx
 * const gemini = useGeminiCached();
 *
 * // Look up word meaning
 * const result = await gemini.lookupMeaning('வணக்கம்', 'வணக்கம், நான் குமார்', 'both');
 * if (result.data) {
 *   console.log(result.data.meaningEn); // "Hello"
 *   console.log(result.cached); // true if from cache
 * }
 * ```
 */
export function useGeminiCached(apiBasePath: string = '/api'): UseGeminiCachedReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  // Track in-flight requests to prevent duplicates
  const inFlightRequests = useRef<Map<string, Promise<unknown>>>(new Map());

  // Look up word meaning with context
  const lookupMeaning = useCallback(
    async (
      word: string,
      context: string,
      languageMode: LanguageMode = 'both'
    ): Promise<GeminiResult<{ meaningEn: string | null; meaningTa: string | null }>> => {
      const cacheKey = `meaning:${word}:${context}:${languageMode}`;

      // Check if request is already in flight
      const existing = inFlightRequests.current.get(cacheKey);
      if (existing) {
        return existing as Promise<
          GeminiResult<{ meaningEn: string | null; meaningTa: string | null }>
        >;
      }

      setIsLoading(true);
      setError(null);

      const request = (async () => {
        try {
          const response = await fetch(`${apiBasePath}/meaning`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              word,
              context,
              language_mode: languageMode,
            }),
          });

          if (response.status === 429) {
            const retryHeader = response.headers.get('Retry-After');
            const retrySeconds = retryHeader ? parseInt(retryHeader, 10) : 60;
            setIsRateLimited(true);
            setRetryAfter(retrySeconds);

            // Auto-clear rate limit after retry period
            setTimeout(() => {
              setIsRateLimited(false);
              setRetryAfter(null);
            }, retrySeconds * 1000);

            return {
              data: null,
              cached: false,
              error: 'Rate limit exceeded. Please wait a moment.',
            };
          }

          if (!response.ok) {
            const data = await response.json();
            const errorMsg =
              data.code === 'AI_UNAVAILABLE'
                ? 'AI service is temporarily unavailable.'
                : data.error || 'Failed to look up meaning';

            setError(errorMsg);
            return { data: null, cached: false, error: errorMsg };
          }

          const data = await response.json();

          return {
            data: {
              meaningEn: data.meaning_en,
              meaningTa: data.meaning_ta,
            },
            cached: data.cached || false,
            error: null,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to look up meaning';
          setError(message);
          return { data: null, cached: false, error: message };
        } finally {
          setIsLoading(false);
          inFlightRequests.current.delete(cacheKey);
        }
      })();

      inFlightRequests.current.set(cacheKey, request);
      return request;
    },
    [apiBasePath]
  );

  // Generic cached AI call
  const cachedCall = useCallback(
    async <T>(
      task: string,
      input: Record<string, unknown>,
      fetcher: () => Promise<T>
    ): Promise<GeminiResult<T>> => {
      const inputStr = JSON.stringify({ task, ...input });
      const cacheKey = `ai:${inputStr}`;

      // Check if request is already in flight
      const existing = inFlightRequests.current.get(cacheKey);
      if (existing) {
        return existing as Promise<GeminiResult<T>>;
      }

      setIsLoading(true);
      setError(null);

      const request = (async () => {
        try {
          // First, check cache
          const cacheResponse = await fetch(
            `${apiBasePath}/ai/cache?task=${encodeURIComponent(task)}&input=${encodeURIComponent(JSON.stringify(input))}`
          );

          if (cacheResponse.ok) {
            const cached = await cacheResponse.json();
            if (cached.hit) {
              return {
                data: cached.data as T,
                cached: true,
                error: null,
              };
            }
          }

          // Not in cache, make the actual call
          const data = await fetcher();

          // Store in cache (fire and forget)
          fetch(`${apiBasePath}/ai/cache`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task,
              input,
              output: data,
            }),
          }).catch(() => {
            // Ignore cache storage errors
          });

          return {
            data,
            cached: false,
            error: null,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'AI operation failed';
          setError(message);
          return { data: null, cached: false, error: message };
        } finally {
          setIsLoading(false);
          inFlightRequests.current.delete(cacheKey);
        }
      })();

      inFlightRequests.current.set(cacheKey, request);
      return request;
    },
    [apiBasePath]
  );

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    isRateLimited,
    retryAfter,
    lookupMeaning,
    cachedCall,
    clearError,
  };
}

export default useGeminiCached;
