'use client';

/**
 * SorporulQuestionCard - Display a sorporul (word meaning) question
 * Feature: 005-sorporul
 *
 * Shows the target Tamil word and MCQ options for selecting the correct definition.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MCQOptions } from '@/components/practice/MCQOptions';
import { cn } from '@/lib/utils';
import type { OptionLabel, PracticeOptionDTO } from '@/types/practice';

export interface SorporulQuestionCardProps {
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
}

export function SorporulQuestionCard({
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
}: SorporulQuestionCardProps) {
  const progress = Math.round((questionNumber / totalQuestions) * 100);

  return (
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
          <span className="font-tamil text-2xl text-orange-600">
            {targetWord}
          </span>
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
  );
}

export default SorporulQuestionCard;
