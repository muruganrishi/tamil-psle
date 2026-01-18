'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TokenizedText, containsTamil } from '@/components/tokenized-text';
import type { LanguageMode } from '@/types/database';

export type Option = {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
};

export type Question = {
  id: string;
  question_text: string;
  options: Option[];
  passage?: {
    id: string;
    title: string;
    content: string;
  } | null;
};

interface MCQCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  onNext: () => void;
  onPrevious?: () => void;
  showPrevious?: boolean;
  isLast?: boolean;
  disabled?: boolean;
  /** Language mode for word meaning lookup */
  languageMode?: LanguageMode;
}

export function MCQCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  onNext,
  onPrevious,
  showPrevious = true,
  isLast = false,
  disabled = false,
  languageMode = 'both',
}: MCQCardProps) {
  // Helper to render text with tokenization for Tamil words
  const renderText = (text: string, className?: string) => {
    if (containsTamil(text)) {
      return <TokenizedText text={text} languageMode={languageMode} className={className} />;
    }
    return <span className={className}>{text}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Passage (if comprehension) */}
      {question.passage && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-800">{question.passage.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tamil whitespace-pre-wrap text-gray-800">
              {renderText(question.passage.content)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700">
              {Math.round((questionNumber / totalQuestions) * 100)}%
            </span>
          </div>
          <CardTitle className="font-tamil text-lg leading-relaxed">
            {renderText(question.question_text)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.label}
              onClick={() => !disabled && onSelectOption(option.label)}
              disabled={disabled}
              className={cn(
                'w-full rounded-lg border-2 p-4 text-left transition-all',
                'hover:border-orange-300 hover:bg-orange-50',
                'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                selectedOption === option.label
                  ? 'border-orange-500 bg-orange-100'
                  : 'border-gray-200 bg-white',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    selectedOption === option.label
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {option.label}
                </span>
                <span className="font-tamil pt-1">{renderText(option.text)}</span>
              </div>
            </button>
          ))}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {showPrevious && onPrevious ? (
              <Button variant="outline" onClick={onPrevious} disabled={disabled}>
                Previous
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={onNext}
              disabled={!selectedOption || disabled}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLast ? 'Submit' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MCQResultCardProps {
  question: Question;
  questionNumber: number;
  selectedOption: string;
  correctOption: string;
  /** Language mode for word meaning lookup */
  languageMode?: LanguageMode;
}

export function MCQResultCard({
  question,
  questionNumber,
  selectedOption,
  correctOption,
  languageMode = 'both',
}: MCQResultCardProps) {
  const isCorrect = selectedOption === correctOption;

  // Helper to render text with tokenization for Tamil words
  const renderText = (text: string, className?: string) => {
    if (containsTamil(text)) {
      return <TokenizedText text={text} languageMode={languageMode} className={className} />;
    }
    return <span className={className}>{text}</span>;
  };

  return (
    <Card className={cn('border-2', isCorrect ? 'border-green-200' : 'border-red-200')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Question {questionNumber}</span>
          <span
            className={cn(
              'rounded px-2 py-1 text-xs font-medium',
              isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}
          >
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        </div>
        <CardTitle className="font-tamil text-base leading-relaxed">
          {renderText(question.question_text)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.label;
          const isAnswer = correctOption === option.label;

          return (
            <div
              key={option.label}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                isAnswer && 'border-green-500 bg-green-50',
                isSelected && !isAnswer && 'border-red-500 bg-red-50',
                !isAnswer && !isSelected && 'border-gray-200'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isAnswer && 'bg-green-500 text-white',
                  isSelected && !isAnswer && 'bg-red-500 text-white',
                  !isAnswer && !isSelected && 'bg-gray-100 text-gray-700'
                )}
              >
                {option.label}
              </span>
              <span className="font-tamil text-sm">{renderText(option.text)}</span>
              {isAnswer && <span className="ml-auto text-xs text-green-600">Correct answer</span>}
              {isSelected && !isAnswer && (
                <span className="ml-auto text-xs text-red-600">Your answer</span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
