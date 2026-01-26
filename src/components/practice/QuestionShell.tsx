'use client';

/**
 * QuestionShell - Container for practice questions
 * READ-ONLY: Feature agents must not modify this file
 *
 * Provides consistent layout and structure for all practice sections.
 * Handles passage display, question rendering, and navigation.
 */

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PassageDTO } from '@/types/practice';

export interface QuestionShellProps {
  /** Question number (1-indexed) */
  questionNumber: number;
  /** Total questions in session */
  totalQuestions: number;
  /** Question text content */
  questionText: ReactNode;
  /** Optional passage for comprehension questions */
  passage?: PassageDTO | null;
  /** Options/answer area content */
  children: ReactNode;
  /** Navigation buttons */
  navigation?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
}

export function QuestionShell({
  questionNumber,
  totalQuestions,
  questionText,
  passage,
  children,
  navigation,
  className,
  isLoading = false,
}: QuestionShellProps) {
  const progress = Math.round((questionNumber / totalQuestions) * 100);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Passage Card (if comprehension) */}
      {passage && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-800">{passage.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tamil whitespace-pre-wrap text-gray-800 leading-relaxed">
              {passage.content}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Question Card */}
      <Card className={cn(isLoading && 'opacity-60')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
              {progress}%
            </span>
          </div>
          <CardTitle className="font-tamil text-lg leading-relaxed pt-2">
            {questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Options/Answer area */}
          {children}

          {/* Navigation */}
          {navigation && <div className="pt-4 border-t">{navigation}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

export default QuestionShell;
