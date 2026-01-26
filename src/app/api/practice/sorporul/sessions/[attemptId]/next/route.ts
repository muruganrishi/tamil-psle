/**
 * API Route: /api/practice/sorporul/sessions/[attemptId]/next
 * Get the next question for a sorporul practice session
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NextQuestionRequestSchema } from '@/lib/validators/practice/student';
import type { Database } from '@/types/database';
import type { PracticeQuestionDTO, PracticeOptionDTO } from '@/types/practice';

type Question = Database['public']['Tables']['questions']['Row'];
type QuestionOption = Database['public']['Tables']['question_options']['Row'];
type Attempt = Database['public']['Tables']['attempts']['Row'];

interface QuestionWithOptions extends Question {
  question_options: QuestionOption[];
}

/**
 * GET /api/practice/sorporul/sessions/[attemptId]/next
 * Fetch the next question in the session
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createClient();
    const { attemptId } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const parseResult = NextQuestionRequestSchema.safeParse({
      attemptId,
      currentQuestionNumber: searchParams.get('current') ?? '0',
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { currentQuestionNumber } = parseResult.data;

    // Get the attempt
    const { data: attempt, error: attemptError } = (await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single()) as { data: Attempt | null; error: unknown };

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found', code: 'ATTEMPT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (attempt.completed_at) {
      return NextResponse.json(
        { error: 'Attempt already completed', code: 'ATTEMPT_ALREADY_COMPLETED' },
        { status: 400 }
      );
    }

    if (attempt.section !== 'sorporul') {
      return NextResponse.json(
        { error: 'Attempt is not for sorporul section', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Get questions the user has already answered in this attempt
    const { data: answeredQuestions } = (await supabase
      .from('attempt_answers')
      .select('question_id')
      .eq('attempt_id', attemptId)) as { data: { question_id: string }[] | null };

    const answeredIds = (answeredQuestions || []).map((a) => a.question_id);
    const nextQuestionNumber = currentQuestionNumber + 1;

    if (nextQuestionNumber > attempt.total_questions) {
      return NextResponse.json(
        { error: 'No more questions', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch the next question (not already answered)
    let query = supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('section', 'sorporul')
      .eq('status', 'published')
      .limit(1);

    // Exclude already answered questions
    if (answeredIds.length > 0) {
      query = query.not('id', 'in', `(${answeredIds.join(',')})`);
    }

    const { data: questions, error: questionError } = (await query) as {
      data: QuestionWithOptions[] | null;
      error: unknown;
    };

    if (questionError || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No more questions available', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const question = questions[0];

    // Transform to DTO format
    const options: PracticeOptionDTO[] = question.question_options
      .sort((a, b) => a.option_label.localeCompare(b.option_label))
      .map((opt) => ({
        label: opt.option_label as 'A' | 'B' | 'C' | 'D',
        text: opt.option_text,
      }));

    // Extract sorporul-specific metadata
    const metadata = (question.metadata || {}) as Record<string, unknown>;

    const questionDTO: PracticeQuestionDTO = {
      id: question.id,
      section: 'sorporul',
      questionText: question.question_text,
      options,
      passage: null, // Sorporul questions don't have passages
      metadata: {
        difficulty: metadata.difficulty as number | undefined,
        tags: metadata.tags as string[] | undefined,
        source: metadata.source as string | undefined,
        targetWord: metadata.targetWord as string | undefined,
        wordClass: metadata.wordClass as string | undefined,
        exampleSentence: metadata.exampleSentence as string | undefined,
      },
    };

    return NextResponse.json({
      question: questionDTO,
      questionNumber: nextQuestionNumber,
      totalQuestions: attempt.total_questions,
      isLast: nextQuestionNumber >= attempt.total_questions,
    });
  } catch (error) {
    console.error('Next question GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
