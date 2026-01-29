'use client';

/**
 * Adaimozhi Practice Page - Student fill-in-blank epithet practice
 * Feature: 003-adaimozhi
 *
 * Students practice completing Tamil epithet/compound phrases by selecting
 * the correct word to fill in the blank.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdaimozhiQuestionCard } from '@/components/adaimozhi';
import { ProgressIndicator } from '@/components/practice/ProgressIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageToggle } from '@/components/language-toggle';
import type { AdaimozhiQuestion, OptionLabel } from '@/lib/validators/adaimozhi';
import type { LanguageMode } from '@/types/database';

interface SessionState {
  attemptId: string;
  questions: AdaimozhiQuestion[];
  currentIndex: number;
  answers: Map<string, { selected: OptionLabel; isCorrect: boolean }>;
  showResult: boolean;
}

interface AttemptResult {
  score: number;
  total: number;
  results: Array<{
    adaimozhiId: string;
    questionText: string;
    selectedOption: OptionLabel;
    correctOption: OptionLabel;
    isCorrect: boolean;
  }>;
}

export default function AdaimozhiPracticePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('both');

  // Fetch language preference
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

  // Start a new practice session
  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/practice/adaimozhi/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionCount: 10 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to start session');
      }

      setSession({
        attemptId: data.attemptId,
        questions: data.questions,
        currentIndex: 0,
        answers: new Map(),
        showResult: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    startSession();
  }, [startSession]);

  // Handle answer selection
  const handleAnswer = async (option: OptionLabel) => {
    if (!session || session.showResult) return;

    const currentQuestion = session.questions[session.currentIndex];
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/practice/adaimozhi/sessions/${session.attemptId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adaimozhiId: currentQuestion.id,
            selectedOption: option,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit answer');
      }

      // Update session with answer
      const newAnswers = new Map(session.answers);
      newAnswers.set(currentQuestion.id, {
        selected: option,
        isCorrect: data.isCorrect,
      });

      setSession({
        ...session,
        answers: newAnswers,
        showResult: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  // Move to next question
  const handleNext = () => {
    if (!session) return;

    const nextIndex = session.currentIndex + 1;

    if (nextIndex >= session.questions.length) {
      // Session complete - calculate results
      const results = session.questions.map((q) => {
        const answer = session.answers.get(q.id);
        return {
          adaimozhiId: q.id,
          questionText: q.questionText,
          selectedOption: answer?.selected || 'A',
          correctOption: q.correctOption || 'A',
          isCorrect: answer?.isCorrect || false,
        };
      });

      const score = results.filter((r) => r.isCorrect).length;
      setResult({ score, total: results.length, results });
    } else {
      setSession({
        ...session,
        currentIndex: nextIndex,
        showResult: false,
      });
    }
  };

  // Handle retry
  const handleRetry = () => {
    setResult(null);
    setSession(null);
    startSession();
  };

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-gray-600">Loading questions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !result) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <Card>
          <CardContent className="py-12">
            <p className="mb-4 text-red-600">{error}</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button onClick={startSession}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results state
  if (result) {
    const percentage = Math.round((result.score / result.total) * 100);

    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Practice Complete!</h2>
              <div className="text-5xl font-bold text-orange-600 mb-2">
                {result.score}/{result.total}
              </div>
              <p className="text-gray-600">{percentage}% Correct</p>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-gray-700">Review:</h3>
              {result.results.map((r) => (
                <div
                  key={r.adaimozhiId}
                  className={`p-3 rounded-lg ${r.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
                >
                  <p className="font-tamil text-sm">{r.questionText}</p>
                  <p className="text-xs mt-1">
                    {r.isCorrect ? (
                      <span className="text-green-600">Correct</span>
                    ) : (
                      <span className="text-red-600">
                        Your answer: {r.selectedOption} | Correct: {r.correctOption}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button onClick={handleRetry}>Practice Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Practice state
  if (!session) return null;

  const currentQuestion = session.questions[session.currentIndex];
  const currentAnswer = session.answers.get(currentQuestion.id);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Adaimozhi Practice</h1>
          <p className="font-tamil text-orange-600">அடைமொழி பயிற்சி</p>
        </div>
        <LanguageToggle value={languageMode} onChange={setLanguageMode} persistToProfile />
      </div>

      {/* Progress */}
      <div className="mb-4">
        <ProgressIndicator
          current={session.currentIndex + 1}
          total={session.questions.length}
        />
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="py-6">
          <AdaimozhiQuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            showResult={session.showResult}
            selectedAnswer={currentAnswer?.selected}
            languageMode={languageMode}
          />

          {/* Navigation */}
          {session.showResult && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleNext}>
                {session.currentIndex < session.questions.length - 1
                  ? 'Next Question'
                  : 'See Results'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card>
            <CardContent className="py-8 text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              <p>Checking answer...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
