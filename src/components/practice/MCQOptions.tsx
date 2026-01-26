'use client';

/**
 * MCQOptions - Multiple choice option selector
 * READ-ONLY: Feature agents must not modify this file
 *
 * Renders A-D options with keyboard accessibility and various states:
 * - Default: selectable options
 * - Disabled: non-interactive (during submission)
 * - Review: shows correct/incorrect after submission
 */

import { useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { OptionLabel, PracticeOptionDTO } from '@/types/practice';

export interface MCQOptionsProps {
  /** The four options to display */
  options: PracticeOptionDTO[];
  /** Currently selected option (null if none) */
  selectedOption: OptionLabel | null;
  /** Callback when option is selected */
  onSelect: (option: OptionLabel) => void;
  /** Disable interaction */
  disabled?: boolean;
  /** Review mode - shows correct answer */
  reviewMode?: boolean;
  /** The correct answer (required in review mode) */
  correctOption?: OptionLabel;
  /** Custom renderer for option text */
  renderOptionText?: (text: string, label: OptionLabel) => React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function MCQOptions({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  reviewMode = false,
  correctOption,
  renderOptionText,
  className,
}: MCQOptionsProps) {
  // Keyboard navigation: A, B, C, D keys select options
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        e.preventDefault();
        onSelect(key as OptionLabel);
      }
    },
    [disabled, onSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get option styling based on state
  const getOptionStyles = (label: OptionLabel) => {
    const isSelected = selectedOption === label;
    const isCorrect = correctOption === label;
    const isWrongSelection = reviewMode && isSelected && !isCorrect;

    if (reviewMode) {
      if (isCorrect) {
        return 'border-green-500 bg-green-50';
      }
      if (isWrongSelection) {
        return 'border-red-500 bg-red-50';
      }
      return 'border-gray-200 bg-white';
    }

    if (isSelected) {
      return 'border-orange-500 bg-orange-100';
    }

    return 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50';
  };

  // Get label badge styling
  const getLabelStyles = (label: OptionLabel) => {
    const isSelected = selectedOption === label;
    const isCorrect = correctOption === label;
    const isWrongSelection = reviewMode && isSelected && !isCorrect;

    if (reviewMode) {
      if (isCorrect) {
        return 'bg-green-500 text-white';
      }
      if (isWrongSelection) {
        return 'bg-red-500 text-white';
      }
      return 'bg-gray-100 text-gray-700';
    }

    if (isSelected) {
      return 'bg-orange-500 text-white';
    }

    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={cn('space-y-3', className)} role="radiogroup" aria-label="Answer options">
      {options.map((option) => {
        const isSelected = selectedOption === option.label;
        const isCorrect = correctOption === option.label;
        const isWrongSelection = reviewMode && isSelected && !isCorrect;

        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => !disabled && !reviewMode && onSelect(option.label)}
            disabled={disabled || reviewMode}
            className={cn(
              'w-full rounded-lg border-2 p-4 text-left transition-all',
              'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
              getOptionStyles(option.label),
              (disabled || reviewMode) && 'cursor-default'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Option label badge */}
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  getLabelStyles(option.label)
                )}
              >
                {option.label}
              </span>

              {/* Option text */}
              <span className="font-tamil pt-1 flex-1">
                {renderOptionText ? renderOptionText(option.text, option.label) : option.text}
              </span>

              {/* Review mode indicators */}
              {reviewMode && isCorrect && (
                <span className="text-xs text-green-600 font-medium">Correct answer</span>
              )}
              {reviewMode && isWrongSelection && (
                <span className="text-xs text-red-600 font-medium">Your answer</span>
              )}
            </div>
          </button>
        );
      })}

      {/* Keyboard hint */}
      {!disabled && !reviewMode && (
        <p className="text-xs text-gray-400 text-center pt-2">
          Press A, B, C, or D to select an option
        </p>
      )}
    </div>
  );
}

export default MCQOptions;
