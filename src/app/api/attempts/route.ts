import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AttemptRequestSchema } from '@/lib/validators/attempts';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import type { Assignment, QuestionOption, InsertTables } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'attempts');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString() } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = AttemptRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          code: 'INVALID_REQUEST',
          details: parseResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { section, assignment_id, answers } = parseResult.data;

    // If assignment, check if user can still attempt
    if (assignment_id) {
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('max_attempts, due_date')
        .eq('id', assignment_id)
        .single() as { data: Pick<Assignment, 'max_attempts' | 'due_date'> | null; error: unknown };

      if (assignmentError || !assignment) {
        return NextResponse.json(
          { error: 'Assignment not found', code: 'ASSIGNMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Check due date
      if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
        return NextResponse.json(
          { error: 'Assignment deadline has passed', code: 'ASSIGNMENT_CLOSED' },
          { status: 400 }
        );
      }

      // Check attempt count
      const { count: attemptCount } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('assignment_id', assignment_id)
        .not('completed_at', 'is', null) as { count: number | null };

      if (attemptCount && attemptCount >= assignment.max_attempts) {
        return NextResponse.json(
          { error: 'Maximum attempts reached', code: 'MAX_ATTEMPTS_EXCEEDED' },
          { status: 400 }
        );
      }
    }

    // Get correct answers for all questions
    const questionIds = answers.map((a) => a.question_id);
    const { data: correctAnswers, error: answersError } = await supabase
      .from('question_options')
      .select('question_id, option_label')
      .in('question_id', questionIds)
      .eq('is_correct', true) as { data: Pick<QuestionOption, 'question_id' | 'option_label'>[] | null; error: unknown };

    if (answersError) {
      console.error('Error fetching correct answers:', answersError);
      return NextResponse.json(
        { error: 'Failed to grade attempt', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Create a map of correct answers
    const correctAnswerMap = new Map(
      correctAnswers?.map((ca) => [ca.question_id, ca.option_label]) || []
    );

    // Grade each answer
    const gradedAnswers = answers.map((answer) => {
      const correctOption = correctAnswerMap.get(answer.question_id);
      return {
        question_id: answer.question_id,
        selected_option: answer.selected_option,
        is_correct: answer.selected_option === correctOption,
        correct_answer: correctOption,
      };
    });

    const score = gradedAnswers.filter((a) => a.is_correct).length;
    const total = answers.length;

    // Create the attempt record
    const attemptData: InsertTables<'attempts'> = {
      user_id: user.id,
      assignment_id: assignment_id ?? undefined,
      section: section,
      total_questions: total,
      score: score,
      completed_at: new Date().toISOString(),
    };

    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert(attemptData as never)
      .select('id')
      .single() as { data: { id: string } | null; error: unknown };

    if (attemptError || !attempt) {
      console.error('Error creating attempt:', attemptError);
      return NextResponse.json(
        { error: 'Failed to save attempt', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Insert individual answers
    const answerRecords: InsertTables<'attempt_answers'>[] = gradedAnswers.map((ga) => ({
      attempt_id: attempt.id,
      question_id: ga.question_id,
      selected_option: ga.selected_option as 'A' | 'B' | 'C' | 'D',
      is_correct: ga.is_correct,
    }));

    const { error: insertAnswersError } = await supabase
      .from('attempt_answers')
      .insert(answerRecords as never[]);

    if (insertAnswersError) {
      console.error('Error saving answers:', insertAnswersError);
      // Attempt was created but answers failed - still return the result
    }

    // Return the results
    return NextResponse.json({
      attempt_id: attempt.id,
      score,
      total,
      results: gradedAnswers.map((ga) => ({
        question_id: ga.question_id,
        correct: ga.is_correct,
        correct_answer: ga.correct_answer,
      })),
    });
  } catch (error) {
    console.error('Attempts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch attempt details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const attemptId = searchParams.get('id');
    const section = searchParams.get('section');

    if (attemptId) {
      // Fetch specific attempt
      const { data: attempt, error } = await supabase
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
        .single();

      if (error || !attempt) {
        return NextResponse.json(
          { error: 'Attempt not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(attempt);
    }

    // Fetch attempts by section
    let query = supabase
      .from('attempts')
      .select('id, section, score, total_questions, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (section) {
      query = query.eq('section', section);
    }

    const { data: attempts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch attempts', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attempts: attempts || [] });
  } catch (error) {
    console.error('Get attempts error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
