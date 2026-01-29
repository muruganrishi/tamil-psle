'use client';

/**
 * Sorporul Practice Page - Student word meanings practice
 * Feature: 005-sorporul
 *
 * Students select the correct Tamil definition for a given Tamil word.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SorporulQuestionCard } from '@/components/sorporul/SorporulQuestionCard';
import { ResultsSummary } from '@/components/results-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { OptionLabel, PracticeOptionDTO } from '@/types/practice';

interface SorporulQuestion {
  id: string;
  targetWord: string;
  options: PracticeOptionDTO[];
}

interface Answer {
  question_id: string;
  selected_option: OptionLabel;
}

interface QuestionResult {
  question_id: string;
  correct: boolean;
  correct_answer: OptionLabel;
}

interface AttemptResponse {
  attempt_id: string;
  score: number;
  total: number;
  results: QuestionResult[];
}

export default function SorporulPracticePage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<SorporulQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResponse | null>(null);

  // Fetch sorporul questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/practice/sorporul/questions?limit=10');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      if (!data.questions || data.questions.length === 0) {
        setError('No questions available for word meanings practice yet.');
        return;
      }

      setQuestions(data.questions);
      setAnswers(
        data.questions.map((q: SorporulQuestion) => ({
          question_id: q.id,
          selected_option: '' as OptionLabel,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handle option selection
  const handleSelectOption = useCallback(
    (option: OptionLabel) => {
      setAnswers((prev) =>
        prev.map((a, i) =>
          i === currentIndex ? { ...a, selected_option: option } : a
        )
      );
    },
    [currentIndex]
  );

  // Handle next question or submit
  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Submit the attempt
      await handleSubmit();
    }
  }, [currentIndex, questions.length]);

  // Handle previous question
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Submit attempt
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const validAnswers = answers.filter((a) => a.selected_option);

      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'sorporul',
          assignment_id: null,
          answers: validAnswers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit attempt');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle retry
  const handleRetry = useCallback(() => {
    setResult(null);
    setCurrentIndex(0);
    setAnswers([]);
    fetchQuestions();
  }, [fetchQuestions]);

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
              <Button onClick={fetchQuestions}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results state
  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <ResultsSummary
          score={result.score}
          total={result.total}
          sectionName="Word Meanings"
          sectionTamil="சொற்பொருள்"
          attemptId={result.attempt_id}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Practice state
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex]?.selected_option || null;

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Word Meanings</h1>
        <p className="font-tamil text-orange-600">சொற்பொருள்</p>
      </div>

      {/* Question Card */}
      <SorporulQuestionCard
        targetWord={currentQuestion.targetWord}
        options={currentQuestion.options}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        selectedOption={currentAnswer}
        onSelectOption={handleSelectOption}
        onNext={handleNext}
        onPrevious={handlePrevious}
        showPrevious={currentIndex > 0}
        isLast={currentIndex === questions.length - 1}
        disabled={submitting}
      />

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card>
            <CardContent className="py-8 text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              <p>Submitting your answers...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
