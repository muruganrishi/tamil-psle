'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MCQCard, Question } from '@/components/mcq-card';
import { ResultsSummary } from '@/components/results-summary';
import { getSectionById } from '@/components/section-picker';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { LanguageMode } from '@/types/database';

type Answer = {
  question_id: string;
  selected_option: string;
};

type QuestionResult = {
  question_id: string;
  correct: boolean;
  correct_answer: string;
};

type AttemptResponse = {
  attempt_id: string;
  score: number;
  total: number;
  results: QuestionResult[];
};

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.section as string;
  const section = getSectionById(sectionId);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResponse | null>(null);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('both');

  // Fetch user's language preference
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

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions?section=${sectionId}&limit=10`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      if (data.questions.length === 0) {
        setError('No questions available for this section yet.');
        return;
      }

      setQuestions(data.questions);
      setAnswers(data.questions.map((q: Question) => ({ question_id: q.id, selected_option: '' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    if (sectionId) {
      fetchQuestions();
    }
  }, [sectionId, fetchQuestions]);

  const handleSelectOption = (option: string) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIndex ? { ...a, selected_option: option } : a))
    );
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Submit the attempt
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: sectionId,
          assignment_id: null,
          answers: answers.filter((a) => a.selected_option),
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

  const handleRetry = () => {
    setResult(null);
    setCurrentIndex(0);
    setAnswers([]);
    fetchQuestions();
  };

  // Invalid section
  if (!section) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-4 text-2xl font-bold">Section Not Found</h1>
        <p className="mb-4 text-gray-600">The section &quot;{sectionId}&quot; does not exist.</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

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
          sectionName={section.name}
          sectionTamil={section.tamil}
          attemptId={result.attempt_id}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Practice state
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex]?.selected_option || null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{section.name}</h1>
          <p className="font-tamil text-orange-600">{section.tamil}</p>
        </div>
        <LanguageToggle
          value={languageMode}
          onChange={setLanguageMode}
          persistToProfile
        />
      </div>

      {/* MCQ Card */}
      {currentQuestion && (
        <MCQCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedOption={currentAnswer}
          onSelectOption={handleSelectOption}
          onNext={handleNext}
          onPrevious={handlePrevious}
          showPrevious={currentIndex > 0}
          isLast={currentIndex === questions.length - 1}
          disabled={submitting}
          languageMode={languageMode}
        />
      )}

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
