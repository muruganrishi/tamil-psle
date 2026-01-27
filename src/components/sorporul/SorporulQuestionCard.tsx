'use client';

/**
 * SorporulQuestionCard - Display a sorporul (word meaning) question
 * Feature: 005-sorporul
 *
 * Shows the target Tamil word and MCQ options for selecting the correct definition.
 * Integrates with WordGlossaryPopover for any-word lookup on the target word.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MCQOptions } from '@/components/practice/MCQOptions';
import { WordGlossaryPopover } from '@/components/practice/WordGlossaryPopover';
import { cn } from '@/lib/utils';
import type { OptionLabel, PracticeOptionDTO } from '@/types/practice';
import type { LanguageMode } from '@/types/database';

export interface SorporulQuestionCardProps {
  /** Unique question ID */
  questionId: string;
  /** The target Tamil word */
  targetWord: string;
  /** The four definition options */
  options: PracticeOptionDTO[];
  /** Question number (1-indexed) */
  questionNumber: number;
  /** Total questions in session */
  totalQuestions: number;
  /** Currently selected option */
  selectedOption: OptionLabel | null;
  /** Callback when option is selected */
  onSelectOption: (option: OptionLabel) => void;
  /** Callback for next question */
  onNext: () => void;
  /** Callback for previous question */
  onPrevious?: () => void;
  /** Whether to show previous button */
  showPrevious?: boolean;
  /** Whether this is the last question */
  isLast?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Review mode - shows correct answer */
  reviewMode?: boolean;
  /** Correct answer (for review mode) */
  correctOption?: OptionLabel;
  /** Language mode for word lookup */
  languageMode?: LanguageMode;
  /** Callback when a word is saved to vocabulary */
  onWordSaved?: (word: string) => void;
}

export function SorporulQuestionCard({
  questionId,
  targetWord,
  options,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  onNext,
  onPrevious,
  showPrevious = false,
  isLast = false,
  disabled = false,
  reviewMode = false,
  correctOption,
  languageMode = 'both',
  onWordSaved,
}: SorporulQuestionCardProps) {
  const progress = Math.round((questionNumber / totalQuestions) * 100);

  // Word glossary popover state
  const [popoverWord, setPopoverWord] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

  // Handle click on target word to show meaning
  const handleWordClick = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverWord({
      word: targetWord,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      },
    });
  }, [targetWord]);

  // Close popover
  const handleClosePopover = useCallback(() => {
    setPopoverWord(null);
  }, []);

  // Handle word saved
  const handleWordSaved = useCallback(
    (word: string) => {
      onWordSaved?.(word);
    },
    [onWordSaved]
  );

  return (
    <>
      <Card className={cn(disabled && 'opacity-60')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
              {progress}%
            </span>
          </div>
          <CardTitle className="pt-4">
            <div className="text-sm text-gray-600 mb-2">
              Select the correct meaning for:
            </div>
            <span
              className="font-tamil text-3xl text-orange-600 cursor-pointer hover:underline decoration-orange-300 decoration-2 underline-offset-4"
              onClick={handleWordClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleWordClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
                }
              }}
              title="Click to see word meaning"
            >
              {targetWord}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              (Click the word to see its meaning)
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MCQ Options */}
          <MCQOptions
            options={options}
            selectedOption={selectedOption}
            onSelect={onSelectOption}
            disabled={disabled}
            reviewMode={reviewMode}
            correctOption={correctOption}
          />

          {/* Navigation */}
          <div className="flex justify-between gap-4 border-t pt-4">
            {showPrevious ? (
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={disabled}
              >
                Previous
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={onNext}
              disabled={disabled || (!reviewMode && !selectedOption)}
              className="min-w-[100px]"
            >
              {isLast ? 'Submit' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Word Glossary Popover */}
      {popoverWord && (
        <WordGlossaryPopover
          word={popoverWord.word}
          context={`${targetWord} - word meaning practice`}
          languageMode={languageMode}
          position={popoverWord.position}
          onClose={handleClosePopover}
          onWordSaved={handleWordSaved}
          showSaveButton={true}
        />
      )}
    </>
  );
}

export default SorporulQuestionCard;
