'use client';

/**
 * VocabFlashcard - Flashcard component for vocabulary review
 * Feature: 005-sorporul
 *
 * Shows word on front, reveals meaning when flipped.
 * Provides rating buttons for spaced repetition (again/hard/good/easy).
 */

import { useState, useCallback } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReviewResult = 'again' | 'hard' | 'good' | 'easy';

export interface VocabFlashcardProps {
  /** The Tamil word */
  word: string;
  /** English meaning */
  meaningEn: string | null;
  /** Tamil meaning/synonym */
  meaningTa: string | null;
  /** Context where word was found */
  context: string;
  /** Callback when user rates the card */
  onRate: (result: ReviewResult) => void;
  /** Whether the card is in a loading state */
  isLoading?: boolean;
  /** Current card index (1-indexed) */
  cardNumber?: number;
  /** Total cards in session */
  totalCards?: number;
}

export function VocabFlashcard({
  word,
  meaningEn,
  meaningTa,
  context,
  onRate,
  isLoading = false,
  cardNumber,
  totalCards,
}: VocabFlashcardProps) {
  const [revealed, setRevealed] = useState(false);

  // Handle reveal
  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  // Handle rating - reset revealed state for next card
  const handleRate = useCallback(
    (result: ReviewResult) => {
      setRevealed(false);
      onRate(result);
    },
    [onRate]
  );

  // Rating button styles
  const ratingButtons: { result: ReviewResult; label: string; color: string }[] = [
    { result: 'again', label: 'Again', color: 'bg-red-500 hover:bg-red-600' },
    { result: 'hard', label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600' },
    { result: 'good', label: 'Good', color: 'bg-blue-500 hover:bg-blue-600' },
    { result: 'easy', label: 'Easy', color: 'bg-green-500 hover:bg-green-600' },
  ];

  return (
    <Card className={cn('w-full max-w-md mx-auto', isLoading && 'opacity-50')}>
      <CardContent className="p-6">
        {/* Progress indicator */}
        {cardNumber && totalCards && (
          <div className="text-center text-sm text-gray-500 mb-4">
            Card {cardNumber} of {totalCards}
          </div>
        )}

        {/* Front of card - Word */}
        <div className="text-center py-8">
          <div className="text-sm text-gray-500 mb-2">What is the meaning of:</div>
          <div className="font-tamil text-4xl font-bold text-orange-600 mb-4">{word}</div>

          {/* Context hint */}
          <div className="text-sm text-gray-400 italic">
            Context: {context.length > 50 ? context.slice(0, 50) + '...' : context}
          </div>
        </div>

        {/* Back of card - Meaning (revealed) */}
        {revealed ? (
          <div className="border-t pt-6 mt-4">
            <div className="text-center text-sm text-gray-500 mb-4">Answer</div>
            <div className="space-y-4">
              {meaningEn && (
                <div className="text-center">
                  <span className="text-xs font-medium uppercase text-gray-400 block mb-1">
                    English
                  </span>
                  <p className="text-lg text-gray-800">{meaningEn}</p>
                </div>
              )}
              {meaningTa && (
                <div className="text-center">
                  <span className="text-xs font-medium uppercase text-gray-400 block mb-1">
                    Tamil
                  </span>
                  <p className="font-tamil text-lg text-gray-800">{meaningTa}</p>
                </div>
              )}
              {!meaningEn && !meaningTa && (
                <p className="text-center text-gray-500">No meaning recorded</p>
              )}
            </div>

            {/* Rating buttons */}
            <div className="mt-8">
              <div className="text-center text-sm text-gray-500 mb-3">
                How well did you remember?
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ratingButtons.map(({ result, label, color }) => (
                  <Button
                    key={result}
                    onClick={() => handleRate(result)}
                    disabled={isLoading}
                    className={cn('text-white font-medium', color)}
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      label
                    )}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-1 text-xs text-gray-400 text-center">
                <span>Forgot</span>
                <span>Struggled</span>
                <span>Recalled</span>
                <span>Easy!</span>
              </div>
            </div>
          </div>
        ) : (
          /* Show Answer button */
          <div className="text-center pt-4">
            <Button
              onClick={handleReveal}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Show Answer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VocabFlashcard;
