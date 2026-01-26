'use client';

/**
 * Sorporul (Word Meanings) Practice Page
 * Uses shared practice infrastructure with word tap/save functionality
 */

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePracticeSession } from '@/hooks/practice/usePracticeSession';
import { QuestionShell } from '@/components/practice/QuestionShell';
import { MCQOptions } from '@/components/practice/MCQOptions';
import { TokenizedText, containsTamil } from '@/components/tokenized-text';
import { LanguageToggle } from '@/components/language-toggle';
import { ResultsSummary } from '@/components/results-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { LanguageMode } from '@/types/database';
import type { OptionLabel } from '@/types/practice';

// Section metadata
const SECTION_INFO = {
  id: 'sorporul' as const,
  name: 'Word Meanings',
  tamil: 'சொற்பொருள்',
  description: 'Learn vocabulary by matching Tamil words with their correct definitions.',
};

export default function SorporulPracticePage() {
  const router = useRouter();
  const [languageMode, setLanguageMode] = useState<LanguageMode>('both');
  const [sessionStarted, setSessionStarted] = useState(false);

  // Use the shared practice session hook with sorporul-specific API path
  const session = usePracticeSession('/api/practice/sorporul');

  // Fetch user's language preference on mount
  useEffect(() => {
    async function fetchLanguagePreference() {
      try {
        const response = await fetch('/api/profile/language');
        if (response.ok) {
          const data = await response.json();
          setLanguageMode(data.ui_language || 'both');
        }
      } catch {
        // Default to 'both' on error
      }
    }
    fetchLanguagePreference();
  }, []);

  // Start session on mount (if not started)
  useEffect(() => {
    if (!sessionStarted && session.status === 'idle') {
      setSessionStarted(true);
      session.startSession('sorporul', { questionCount: 10 });
    }
  }, [session, sessionStarted]);

  // Fetch first question when session is active
  useEffect(() => {
    if (session.status === 'active' && session.attemptId && session.questionNumber === 0) {
      session.fetchNextQuestion();
    }
  }, [session]);

  // Handle selecting an option
  const handleSelectOption = useCallback(
    (option: OptionLabel) => {
      session.selectAnswer(option);
    },
    [session]
  );

  // Handle moving to next question
  const handleNext = useCallback(async () => {
    if (session.questionNumber >= session.totalQuestions) {
      // Submit all answers
      await session.submitAnswers();
    } else {
      // Fetch next question
      await session.fetchNextQuestion();
    }
  }, [session]);

  // Handle retry after completion
  const handleRetry = useCallback(() => {
    session.reset();
    setSessionStarted(false);
  }, [session]);

  // Render question text with Tamil word tap functionality
  const renderQuestionText = (text: string) => {
    if (containsTamil(text)) {
      return <TokenizedText text={text} languageMode={languageMode} showSaveButton />;
    }
    return <span>{text}</span>;
  };

  // Render option text with Tamil word tap functionality
  const renderOptionText = (text: string) => {
    if (containsTamil(text)) {
      return <TokenizedText text={text} languageMode={languageMode} showSaveButton />;
    }
    return text;
  };

  // Get currently selected option for the current question
  const getCurrentSelectedOption = (): OptionLabel | null => {
    if (!session.currentQuestion) return null;
    const answer = session.answers.find((a) => a.questionId === session.currentQuestion?.id);
    return answer?.selectedOption ?? null;
  };

  // Error state
  if (session.error && session.status === 'error') {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-red-600">{session.error}</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <Button
                onClick={() => {
                  session.reset();
                  setSessionStarted(false);
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state (starting session or fetching question)
  if (
    session.status === 'idle' ||
    (session.isLoading && !session.currentQuestion) ||
    (session.status === 'active' && session.questionNumber === 0)
  ) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-gray-600">Loading questions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submitting state
  if (session.status === 'submitting') {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-gray-600">Submitting your answers...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results state
  if (session.status === 'completed' && session.results) {
    return (
      <div className="mx-auto max-w-2xl">
        <ResultsSummary
          score={session.results.score}
          total={session.results.total}
          sectionName={SECTION_INFO.name}
          sectionTamil={SECTION_INFO.tamil}
          attemptId={session.results.attemptId}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Practice state - show current question
  if (!session.currentQuestion) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No questions available.</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedOption = getCurrentSelectedOption();
  const isLastQuestion = session.questionNumber >= session.totalQuestions;

  // Extract target word from metadata for display
  const targetWord = session.currentQuestion.metadata?.targetWord as string | undefined;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{SECTION_INFO.name}</h1>
          <p className="font-tamil text-orange-600">{SECTION_INFO.tamil}</p>
          <p className="mt-1 text-sm text-gray-500">
            Tap any Tamil word to see its meaning and save to vocabulary
          </p>
        </div>
        <LanguageToggle value={languageMode} onChange={setLanguageMode} persistToProfile />
      </div>

      {/* Target Word Highlight (if available) */}
      {targetWord && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-orange-800">Target word:</span>
              <span className="font-tamil text-lg font-semibold text-orange-700">
                <TokenizedText text={targetWord} languageMode={languageMode} showSaveButton />
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Shell with MCQ Options */}
      <QuestionShell
        questionNumber={session.questionNumber}
        totalQuestions={session.totalQuestions}
        questionText={renderQuestionText(session.currentQuestion.questionText)}
        passage={session.currentQuestion.passage}
        isLoading={session.isLoading}
        navigation={
          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={!selectedOption || session.isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {session.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isLastQuestion ? (
                'Submit'
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        }
      >
        <MCQOptions
          options={session.currentQuestion.options || []}
          selectedOption={selectedOption}
          onSelect={handleSelectOption}
          disabled={session.isLoading}
          renderOptionText={renderOptionText}
        />
      </QuestionShell>
    </div>
  );
}
