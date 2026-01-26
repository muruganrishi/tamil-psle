'use client';

/**
 * ProgressIndicator - Shows practice session progress
 * READ-ONLY: Feature agents must not modify this file
 *
 * Displays progress as a bar and/or steps indicator.
 * Supports different visual modes for various contexts.
 */

import { cn } from '@/lib/utils';

export interface ProgressIndicatorProps {
  /** Current step/question number (1-indexed) */
  current: number;
  /** Total steps/questions */
  total: number;
  /** Visual mode */
  variant?: 'bar' | 'steps' | 'both';
  /** Show percentage text */
  showPercentage?: boolean;
  /** Show count text (e.g., "3 of 10") */
  showCount?: boolean;
  /** Completed answers (for step indicators) */
  completedSteps?: number[];
  /** Current step is in progress */
  currentInProgress?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

export function ProgressIndicator({
  current,
  total,
  variant = 'bar',
  showPercentage = false,
  showCount = true,
  completedSteps = [],
  currentInProgress = false,
  size = 'md',
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);

  // Size-based styles
  const sizeStyles = {
    sm: {
      bar: 'h-1',
      step: 'h-2 w-2',
      gap: 'gap-1',
      text: 'text-xs',
    },
    md: {
      bar: 'h-2',
      step: 'h-3 w-3',
      gap: 'gap-1.5',
      text: 'text-sm',
    },
    lg: {
      bar: 'h-3',
      step: 'h-4 w-4',
      gap: 'gap-2',
      text: 'text-base',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={cn('w-full', className)}>
      {/* Text indicators */}
      {(showCount || showPercentage) && (
        <div className={cn('flex justify-between mb-1', styles.text, 'text-gray-600')}>
          {showCount && (
            <span>
              {current} of {total}
            </span>
          )}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}

      {/* Progress bar */}
      {(variant === 'bar' || variant === 'both') && (
        <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', styles.bar)}>
          <div
            className={cn(
              'h-full bg-orange-500 transition-all duration-300 ease-out',
              currentInProgress && 'animate-pulse'
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={current}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`Progress: ${current} of ${total}`}
          />
        </div>
      )}

      {/* Step indicators */}
      {(variant === 'steps' || variant === 'both') && (
        <div
          className={cn(
            'flex items-center justify-center flex-wrap',
            styles.gap,
            variant === 'both' && 'mt-2'
          )}
          role="group"
          aria-label="Question progress"
        >
          {Array.from({ length: total }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = completedSteps.includes(stepNum);
            const isCurrent = stepNum === current;
            const isPast = stepNum < current;

            return (
              <div
                key={stepNum}
                className={cn(
                  'rounded-full transition-all',
                  styles.step,
                  // Completed steps
                  isCompleted && 'bg-green-500',
                  // Current step
                  isCurrent && !isCompleted && 'bg-orange-500',
                  isCurrent && currentInProgress && 'animate-pulse',
                  // Past but not completed (skipped)
                  isPast && !isCompleted && !isCurrent && 'bg-gray-400',
                  // Future steps
                  !isPast && !isCurrent && !isCompleted && 'bg-gray-200'
                )}
                aria-label={`Question ${stepNum}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Compact progress badge for inline display
 */
export interface ProgressBadgeProps {
  /** Current step/question number (1-indexed) */
  current: number;
  /** Total steps/questions */
  total: number;
  /** Badge variant */
  variant?: 'default' | 'success' | 'warning';
  /** Additional CSS classes */
  className?: string;
}

export function ProgressBadge({
  current,
  total,
  variant = 'default',
  className,
}: ProgressBadgeProps) {
  const percentage = Math.round((current / total) * 100);

  const variantStyles = {
    default: 'bg-orange-100 text-orange-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-1 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {percentage}%
    </span>
  );
}

export default ProgressIndicator;
