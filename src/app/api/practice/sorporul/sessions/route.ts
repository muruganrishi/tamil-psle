/**
 * API Route: /api/practice/sorporul/sessions
 * Create a new sorporul practice session
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { CreateAttemptRequestSchema } from '@/lib/validators/practice/student';
import type { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type Attempt = Database['public']['Tables']['attempts']['Row'];

/**
 * POST /api/practice/sorporul/sessions
 * Start a new practice session for sorporul section
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'practice-session');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString() },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CreateAttemptRequestSchema.safeParse({
      ...body,
      section: 'sorporul', // Force sorporul section
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { questionCount, assignmentId } = parseResult.data;

    // If assignment provided, validate it
    if (assignmentId) {
      const { data: assignment, error: assignmentError } = (await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()) as { data: Assignment | null; error: unknown };

      if (assignmentError || !assignment) {
        return NextResponse.json(
          { error: 'Assignment not found', code: 'ASSIGNMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Check if sorporul is in assignment sections
      if (!assignment.sections.includes('sorporul')) {
        return NextResponse.json(
          { error: 'Assignment does not include sorporul section', code: 'INVALID_REQUEST' },
          { status: 400 }
        );
      }

      // Check due date
      if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
        return NextResponse.json(
          { error: 'Assignment is past due', code: 'ASSIGNMENT_CLOSED' },
          { status: 400 }
        );
      }

      // Check max attempts
      const { count: attemptCount } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('assignment_id', assignmentId);

      if (attemptCount !== null && attemptCount >= assignment.max_attempts) {
        return NextResponse.json(
          { error: 'Maximum attempts reached', code: 'MAX_ATTEMPTS_EXCEEDED' },
          { status: 400 }
        );
      }
    }

    // Get available sorporul questions
    const { data: questions, error: questionsError } = (await supabase
      .from('questions')
      .select('id')
      .eq('section', 'sorporul')
      .eq('status', 'published')
      .limit(questionCount)) as { data: Pick<Question, 'id'>[] | null; error: unknown };

    if (questionsError) {
      console.error('Failed to fetch questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const availableQuestions = questions || [];
    const actualQuestionCount = Math.min(questionCount, availableQuestions.length);

    if (actualQuestionCount === 0) {
      return NextResponse.json(
        { error: 'No questions available for this section', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create the attempt record
    const { data: attempt, error: attemptError } = (await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        section: 'sorporul',
        assignment_id: assignmentId || null,
        total_questions: actualQuestionCount,
        started_at: new Date().toISOString(),
      } as never)
      .select()
      .single()) as { data: Attempt | null; error: unknown };

    if (attemptError || !attempt) {
      console.error('Failed to create attempt:', attemptError);
      return NextResponse.json(
        { error: 'Failed to create session', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attemptId: attempt.id,
      section: 'sorporul',
      totalQuestions: actualQuestionCount,
      startedAt: attempt.started_at,
    });
  } catch (error) {
    console.error('Practice session POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
