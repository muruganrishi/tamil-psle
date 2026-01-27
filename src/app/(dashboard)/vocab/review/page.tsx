'use client';

/**
 * Vocabulary Flashcard Review Page
 * Feature: 005-sorporul
 *
 * Students review saved words with spaced repetition.
 * Uses SM-2 algorithm via /api/vocab/review.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Loader2, PartyPopper, CalendarClock } from 'lucide-react';
import { VocabFlashcard, type ReviewResult } from '@/components/sorporul/VocabFlashcard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserSavedWord } from '@/types/database';

interface VocabReview {
  word: string;
  next_review_at: string;
  interval_days: number;
  ease: number;
  last_result: string | null;
}

interface WordWithMeaning {
  word: string;
  meaningEn: string | null;
  meaningTa: string | null;
  context: string;
}

export default function VocabReviewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dueWords, setDueWords] = useState<WordWithMeaning[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Fetch words due for review with their meanings
  useEffect(() => {
    async function fetchDueReviews() {
      setLoading(true);
      setError(null);

      try {
        // Fetch due reviews
        const reviewsResponse = await fetch('/api/vocab/review?limit=20');
        if (!reviewsResponse.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const reviewsData = await reviewsResponse.json();
        const reviews: VocabReview[] = reviewsData.reviews || [];

        if (reviews.length === 0) {
          // No reviews due, check if user has saved words at all
          const wordsResponse = await fetch('/api/saved-words');
          if (wordsResponse.ok) {
            const wordsData = await wordsResponse.json();
            if (wordsData.words.length === 0) {
              setError('NO_SAVED_WORDS');
            } else {
              setError('NO_DUE_REVIEWS');
            }
          }
          return;
        }

        // Fetch saved words to get meanings
        const wordsResponse = await fetch('/api/saved-words');
        if (!wordsResponse.ok) {
          throw new Error('Failed to fetch saved words');
        }
        const wordsData = await wordsResponse.json();
        const savedWords: UserSavedWord[] = wordsData.words || [];

        // Match reviews with saved word data
        const wordsWithMeanings: WordWithMeaning[] = reviews
          .map((review) => {
            const savedWord = savedWords.find((w) => w.word === review.word);
            if (savedWord) {
              return {
                word: review.word,
                meaningEn: savedWord.meaning_en,
                meaningTa: savedWord.meaning_ta,
                context: savedWord.context,
              };
            }
            return null;
          })
          .filter((w): w is WordWithMeaning => w !== null);

        if (wordsWithMeanings.length === 0) {
          setError('NO_DUE_REVIEWS');
          return;
        }

        setDueWords(wordsWithMeanings);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('FETCH_ERROR');
      } finally {
        setLoading(false);
      }
    }

    fetchDueReviews();
  }, []);

  // Handle rating a card
  const handleRate = useCallback(
    async (result: ReviewResult) => {
      if (currentIndex >= dueWords.length) return;

      const currentWord = dueWords[currentIndex];
      setSubmitting(true);

      try {
        const response = await fetch('/api/vocab/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: currentWord.word,
            result,
          }),
        });

        if (!response.ok) {
          console.error('Failed to submit review');
        }

        setReviewedCount((prev) => prev + 1);

        // Move to next card or complete session
        if (currentIndex < dueWords.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setSessionComplete(true);
        }
      } catch (err) {
        console.error('Error submitting review:', err);
      } finally {
        setSubmitting(false);
      }
    },
    [currentIndex, dueWords]
  );

  // Handle back to vocab list
  const handleBack = useCallback(() => {
    router.push('/vocab');
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-4 text-gray-600">Loading flashcards...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No saved words state
  if (error === 'NO_SAVED_WORDS') {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">No saved words yet</h2>
            <p className="mt-2 text-gray-600">
              Save some words while practicing to start building your vocabulary bank.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => router.push('/practice/sorporul')}>
                Start Practicing
              </Button>
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vocabulary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No due reviews state
  if (error === 'NO_DUE_REVIEWS') {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarClock className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h2>
            <p className="mt-2 text-gray-600">
              No words are due for review right now. Check back later when your words are ready
              for another review session.
            </p>
            <div className="mt-6">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vocabulary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch error state
  if (error === 'FETCH_ERROR') {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 mb-4">Failed to load flashcards</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session complete state
  if (sessionComplete) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="py-12 text-center">
            <PartyPopper className="mx-auto h-12 w-12 text-orange-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Review Complete!</h2>
            <p className="mt-2 text-gray-600">
              You reviewed {reviewedCount} word{reviewedCount !== 1 ? 's' : ''}.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Keep up the great work! Consistent review helps build long-term memory.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => window.location.reload()}>
                Review More Words
              </Button>
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vocabulary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Review state
  const currentWord = dueWords[currentIndex];

  if (!currentWord) {
    return null;
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-gray-500">
          {reviewedCount} reviewed
        </div>
      </div>

      {/* Title */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">Flashcard Review</h1>
        <p className="font-tamil text-orange-600">மறுபார்வை</p>
      </div>

      {/* Flashcard */}
      <VocabFlashcard
        word={currentWord.word}
        meaningEn={currentWord.meaningEn}
        meaningTa={currentWord.meaningTa}
        context={currentWord.context}
        onRate={handleRate}
        isLoading={submitting}
        cardNumber={currentIndex + 1}
        totalCards={dueWords.length}
      />
    </div>
  );
}
