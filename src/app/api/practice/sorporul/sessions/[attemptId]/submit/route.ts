/**
 * API Route: /api/practice/sorporul/sessions/[attemptId]/submit
 * Submit answers and complete a sorporul practice session
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import { AnswerSubmissionSchema } from '@/lib/validators/practice/student';
import type { Database } from '@/types/database';
import type { QuestionResultDTO, AttemptResultDTO } from '@/types/practice';

type QuestionOption = Database['public']['Tables']['question_options']['Row'];
type Attempt = Database['public']['Tables']['attempts']['Row'];

// Request body schema
const SubmitRequestSchema = z.object({
  answers: z.array(AnswerSubmissionSchema).min(1, 'At least one answer is required'),
});

/**
 * POST /api/practice/sorporul/sessions/[attemptId]/submit
 * Submit all answers and complete the session
 */
export async function POST(
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

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'practice-submit');
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
    const parseResult = SubmitRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { answers } = parseResult.data;

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

    // Get correct answers for all submitted questions
    const questionIds = answers.map((a) => a.questionId);

    const { data: correctOptions, error: optionsError } = (await supabase
      .from('question_options')
      .select('question_id, option_label, is_correct')
      .in('question_id', questionIds)
      .eq('is_correct', true)) as { data: QuestionOption[] | null; error: unknown };

    if (optionsError || !correctOptions) {
      console.error('Failed to fetch correct options:', optionsError);
      return NextResponse.json(
        { error: 'Failed to grade answers', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Create a map of question_id -> correct option
    const correctMap = new Map<string, string>();
    for (const opt of correctOptions) {
      correctMap.set(opt.question_id, opt.option_label);
    }

    // Grade answers and prepare results
    const results: QuestionResultDTO[] = [];
    let score = 0;

    const answerInserts = answers.map((answer) => {
      const correctOption = correctMap.get(answer.questionId);
      const isCorrect = correctOption === answer.selectedOption;

      if (isCorrect) {
        score++;
      }

      results.push({
        questionId: answer.questionId,
        isCorrect,
        correctOption: (correctOption || 'A') as 'A' | 'B' | 'C' | 'D',
        selectedOption: answer.selectedOption,
      });

      return {
        attempt_id: attemptId,
        question_id: answer.questionId,
        selected_option: answer.selectedOption,
        is_correct: isCorrect,
      };
    });

    // Insert answer records
    const { error: insertError } = await supabase.from('attempt_answers').insert(answerInserts as never);

    if (insertError) {
      console.error('Failed to insert answers:', insertError);
      return NextResponse.json(
        { error: 'Failed to save answers', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Update attempt with score and completion time
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('attempts')
      .update({
        score,
        completed_at: completedAt,
      } as never)
      .eq('id', attemptId);

    if (updateError) {
      console.error('Failed to update attempt:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete attempt', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const response: AttemptResultDTO = {
      attemptId,
      score,
      total: answers.length,
      results,
      completedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Submit answers POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
