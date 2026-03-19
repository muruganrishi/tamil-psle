'use client';

/**
 * AdaimozhiQuestionCard - Display adaimozhi fill-in-blank question
 * Feature: 003-adaimozhi
 *
 * Renders a phrase with blank, MCQ options, and meaning display after answer.
 * Integrates with TokenizedText for word-tap meanings.
 */

import { MCQOptions } from '@/components/practice/MCQOptions';
import { TokenizedText } from '@/components/tokenized-text';
import type { AdaimozhiQuestion, OptionLabel } from '@/lib/validators/adaimozhi';

interface AdaimozhiQuestionCardProps {
  /** The adaimozhi question to display */
  question: AdaimozhiQuestion;
  /** Callback when option is selected */
  onAnswer: (option: OptionLabel) => void;
  /** Whether to show the result (after answer submitted) */
  showResult: boolean;
  /** Currently selected answer */
  selectedAnswer?: OptionLabel;
  /** User's preferred language mode for word meanings */
  languageMode?: 'en' | 'ta' | 'both';
  /** Additional CSS classes */
  className?: string;
}

export function AdaimozhiQuestionCard({
  question,
  onAnswer,
  showResult,
  selectedAnswer,
  languageMode = 'both',
  className = '',
}: AdaimozhiQuestionCardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Phrase with blank */}
      <div className="rounded-lg bg-orange-50 p-6 text-center">
        <p className="font-tamil text-2xl leading-relaxed">
          <TokenizedText
            text={question.questionText}
            languageMode={languageMode}
            showSaveButton={true}
          />
        </p>
      </div>

      {/* Instruction */}
      <p className="text-center text-gray-600">
        கோடிட்ட இடத்தை நிரப்புக (Fill in the blank)
      </p>

      {/* MCQ Options */}
      <MCQOptions
        options={question.options}
        selectedOption={selectedAnswer || null}
        onSelect={onAnswer}
        disabled={showResult}
        reviewMode={showResult}
        correctOption={showResult ? question.correctOption : undefined}
      />

      {/* Show meaning after answer */}
      {showResult && question.metadata && (
        <div className="rounded-lg bg-blue-50 p-4 mt-4 space-y-2">
          {/* Complete phrase */}
          <div>
            <p className="text-sm font-medium text-blue-800">
              முழு சொற்றொடர் (Complete Phrase):
            </p>
            <p className="font-tamil text-lg text-blue-700">
              {question.metadata.complete_phrase}
            </p>
          </div>

          {/* Meaning in Tamil */}
          {question.metadata.meaning_ta && (
            <div>
              <p className="text-sm font-medium text-blue-800">
                பொருள் (Meaning):
              </p>
              <p className="font-tamil text-blue-700">
                {question.metadata.meaning_ta}
              </p>
            </div>
          )}

          {/* Meaning in English */}
          {question.metadata.meaning_en && (
            <p className="text-sm text-blue-600 italic">
              {question.metadata.meaning_en}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdaimozhiQuestionCard;
