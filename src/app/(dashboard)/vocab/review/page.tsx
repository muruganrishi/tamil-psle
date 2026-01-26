'use client';

/**
 * Vocabulary Review - Flashcard Page
 * Spaced repetition review using the SM-2 algorithm
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useVocabBank } from '@/hooks/vocab/useVocabBank';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  BookOpen,
  RotateCcw,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VocabReviewDTO, ReviewResultDTO } from '@/types/practice';

// Review button configuration
const REVIEW_BUTTONS: {
  result: ReviewResultDTO['result'];
  label: string;
  description: string;
  color: string;
  hoverColor: string;
}[] = [
  {
    result: 'again',
    label: 'Again',
    description: "Didn't know",
    color: 'bg-red-100 text-red-700 border-red-200',
    hoverColor: 'hover:bg-red-200',
  },
  {
    result: 'hard',
    label: 'Hard',
    description: 'Took effort',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    hoverColor: 'hover:bg-orange-200',
  },
  {
    result: 'good',
    label: 'Good',
    description: 'Remembered',
    color: 'bg-green-100 text-green-700 border-green-200',
    hoverColor: 'hover:bg-green-200',
  },
  {
    result: 'easy',
    label: 'Easy',
    description: 'Too easy',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    hoverColor: 'hover:bg-blue-200',
  },
];

export default function VocabReviewPage() {
  const vocab = useVocabBank();
  const [currentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedWordDetails, setSavedWordDetails] = useState<Map<string, { meaningEn: string | null; meaningTa: string | null; context: string }>>(new Map());

  // Load due reviews on mount
  useEffect(() => {
    vocab.loadDueReviews(20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved words to get meanings and context
  useEffect(() => {
    async function loadWordDetails() {
      try {
        const response = await fetch('/api/saved-words');
        if (response.ok) {
          const data = await response.json();
          const detailsMap = new Map<string, { meaningEn: string | null; meaningTa: string | null; context: string }>();
          for (const word of data.words || []) {
            detailsMap.set(word.word, {
              meaningEn: word.meaning_en,
              meaningTa: word.meaning_ta,
              context: word.context,
            });
          }
          setSavedWordDetails(detailsMap);
        }
      } catch {
        // Ignore errors
      }
    }
    loadWordDetails();
  }, []);

  // Current review item
  const currentReview: VocabReviewDTO | undefined = vocab.dueReviews[currentIndex];

  // Get word details
  const getWordDetails = (word: string) => {
    return savedWordDetails.get(word) || { meaningEn: null, meaningTa: null, context: '' };
  };

  // Handle review submission
  const handleReview = useCallback(
    async (result: ReviewResultDTO['result']) => {
      if (!currentReview || isSubmitting) return;

      setIsSubmitting(true);

      try {
        const response = await vocab.submitReview({
          word: currentReview.word,
          result,
        });

        if (response) {
          setReviewedCount((prev) => prev + 1);
          setShowMeaning(false);

          // Move to next card (the current one is removed from dueReviews by the hook)
          // No need to increment index since the array shrinks
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentReview, isSubmitting, vocab]
  );

  // Handle toggling meaning visibility
  const handleToggleMeaning = useCallback(() => {
    setShowMeaning((prev) => !prev);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!showMeaning) {
        // Space to reveal
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setShowMeaning(true);
        }
      } else if (!isSubmitting) {
        // Number keys for review
        if (e.key === '1') handleReview('again');
        else if (e.key === '2') handleReview('hard');
        else if (e.key === '3') handleReview('good');
        else if (e.key === '4') handleReview('easy');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMeaning, isSubmitting, handleReview]);

  // Loading state
  if (vocab.isLoading && vocab.dueReviews.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-gray-600">Loading review items...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (vocab.error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-red-600">{vocab.error}</p>
            <div className="flex justify-center gap-4">
              <Link href="/vocab">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Vocab
                </Button>
              </Link>
              <Button onClick={() => vocab.loadDueReviews(20)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion state
  if (vocab.dueReviews.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h2 className="mb-2 text-xl font-bold text-gray-800">All caught up!</h2>
            {reviewedCount > 0 ? (
              <p className="mb-4 text-gray-600">
                You reviewed {reviewedCount} word{reviewedCount !== 1 ? 's' : ''} today. Great work!
              </p>
            ) : (
              <p className="mb-4 text-gray-600">
                No words are due for review right now. Check back later or add more words while
                practicing.
              </p>
            )}
            <div className="flex justify-center gap-4">
              <Link href="/vocab">
                <Button variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Vocab Bank
                </Button>
              </Link>
              <Link href="/practice/sorporul">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Practice More
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Review card
  const wordDetails = getWordDetails(currentReview.word);
  const remainingCount = vocab.dueReviews.length;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vocabulary Review</h1>
          <p className="font-tamil text-orange-600">சொல் மீட்டல்</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {remainingCount} word{remainingCount !== 1 ? 's' : ''} remaining
          </p>
          {reviewedCount > 0 && (
            <p className="text-xs text-green-600">{reviewedCount} reviewed today</p>
          )}
        </div>
      </div>

      {/* Flashcard */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <CardDescription>
            {showMeaning ? 'Rate how well you knew this word' : 'Do you know this word?'}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          {/* Word */}
          <div className="mb-8 text-center">
            <p className="font-tamil text-4xl font-bold text-orange-700">{currentReview.word}</p>
            {wordDetails.context && (
              <p className="font-tamil mt-2 text-sm text-gray-500">
                &ldquo;{wordDetails.context}&rdquo;
              </p>
            )}
          </div>

          {/* Meaning (revealed) */}
          {showMeaning && (
            <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
              {wordDetails.meaningEn && (
                <div>
                  <span className="text-xs font-medium uppercase text-gray-400">English</span>
                  <p className="text-lg text-gray-800">{wordDetails.meaningEn}</p>
                </div>
              )}
              {wordDetails.meaningTa && (
                <div>
                  <span className="text-xs font-medium uppercase text-gray-400">Tamil</span>
                  <p className="font-tamil text-lg text-gray-800">{wordDetails.meaningTa}</p>
                </div>
              )}
              {!wordDetails.meaningEn && !wordDetails.meaningTa && (
                <p className="text-gray-500 italic">No meaning saved for this word.</p>
              )}
            </div>
          )}

          {/* Show/Hide button or Review buttons */}
          {!showMeaning ? (
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleToggleMeaning}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Eye className="mr-2 h-4 w-4" />
                Show Meaning
              </Button>
              <p className="mt-2 text-xs text-gray-400">Press Space or Enter</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {REVIEW_BUTTONS.map((btn, index) => (
                  <Button
                    key={btn.result}
                    variant="outline"
                    onClick={() => handleReview(btn.result)}
                    disabled={isSubmitting}
                    className={cn(
                      'flex h-auto flex-col py-3 transition-all',
                      btn.color,
                      btn.hoverColor,
                      isSubmitting && 'opacity-60'
                    )}
                  >
                    <span className="font-semibold">{btn.label}</span>
                    <span className="text-xs opacity-80">{btn.description}</span>
                    <span className="mt-1 text-xs opacity-60">({index + 1})</span>
                  </Button>
                ))}
              </div>
              {isSubmitting && (
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard shortcuts hint */}
      <Card className="border-dashed bg-gray-50">
        <CardContent className="py-3">
          <p className="text-center text-xs text-gray-500">
            <strong>Keyboard shortcuts:</strong> Space/Enter to reveal • 1-4 to rate
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Link href="/vocab">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vocab Bank
          </Button>
        </Link>
      </div>
    </div>
  );
}
