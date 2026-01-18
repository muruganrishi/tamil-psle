import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MCQResultCard } from '@/components/mcq-card';
import { ResultsSummary } from '@/components/results-summary';
import { getSectionById } from '@/components/section-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Attempt, AttemptAnswer, Question, QuestionOption, Passage } from '@/types/database';

// Types for query results
type AttemptWithAnswers = Attempt & {
  answers: AttemptAnswer[];
};

type QuestionWithDetails = Question & {
  passage: Passage | null;
  options: QuestionOption[];
};

interface ResultsPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { attemptId } = await params;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the attempt with answers
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select(
      `
      id,
      section,
      score,
      total_questions,
      completed_at,
      answers:attempt_answers (
        question_id,
        selected_option,
        is_correct
      )
    `
    )
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single() as { data: AttemptWithAnswers | null; error: unknown };

  if (attemptError || !attempt) {
    notFound();
  }

  // Get the section info
  const section = getSectionById(attempt.section);
  if (!section) {
    notFound();
  }

  // Fetch the questions with options
  const questionIds = attempt.answers.map((a) => a.question_id);
  const { data: questions } = await supabase
    .from('questions')
    .select(
      `
      id,
      question_text,
      passage:passages (
        id,
        title,
        content
      ),
      options:question_options (
        option_label,
        option_text,
        is_correct
      )
    `
    )
    .in('id', questionIds) as { data: QuestionWithDetails[] | null };

  // Create a map of questions for easy lookup
  const questionMap = new Map(
    (questions || []).map((q) => [
      q.id,
      {
        id: q.id,
        question_text: q.question_text,
        passage: q.passage,
        options: q.options
          .sort((a, b) => a.option_label.localeCompare(b.option_label))
          .map((opt) => ({
            label: opt.option_label,
            text: opt.option_text,
          })),
        correctOption: q.options.find((opt) => opt.is_correct)?.option_label || 'A',
      },
    ])
  );

  // Build results with question data
  const resultsWithQuestions = attempt.answers.map((answer) => {
    const question = questionMap.get(answer.question_id);
    return {
      ...answer,
      question,
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Summary Card */}
      <ResultsSummary
        score={attempt.score ?? 0}
        total={attempt.total_questions}
        sectionName={section.name}
        sectionTamil={section.tamil}
        showDetails={false}
      />

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resultsWithQuestions.map((result, index) =>
            result.question ? (
              <MCQResultCard
                key={result.question_id}
                question={result.question}
                questionNumber={index + 1}
                selectedOption={result.selected_option}
                correctOption={result.question.correctOption}
              />
            ) : null
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Link href={`/practice/${attempt.section}`}>
          <Button className="bg-orange-600 hover:bg-orange-700">Practice Again</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
