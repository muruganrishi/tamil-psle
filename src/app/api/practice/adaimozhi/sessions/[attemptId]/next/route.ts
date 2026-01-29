/**
 * GET /api/practice/adaimozhi/sessions/[attemptId]/next - Get next unanswered question
 * Feature: 003-adaimozhi
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  selectDistractors,
  buildMCQOptions,
  findCorrectLabel,
} from '@/lib/utils/adaimozhi-distractors';
import type { AdaimozhiQuestion } from '@/lib/validators/adaimozhi';
import type { AdaimozhiRow, AttemptRow, AttemptAnswerRow } from '@/types/adaimozhi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createClient();
    const { attemptId } = await params;

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Fetch the attempt and verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attempt, error: attemptError } = (await (supabase as any)
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single()) as { data: AttemptRow | null; error: any };

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    if (attempt.completed_at) {
      return NextResponse.json(
        { error: { code: 'SESSION_EXPIRED', message: 'Session already completed' } },
        { status: 400 }
      );
    }

    // Get already answered adaimozhi IDs for this attempt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: answered } = await (supabase as any)
      .from('attempt_answers')
      .select('adaimozhi_id')
      .eq('attempt_id', attemptId)
      .not('adaimozhi_id', 'is', null) as { data: AttemptAnswerRow[] | null };

    const answeredIds = (answered || []).map((a) => a.adaimozhi_id).filter(Boolean) as string[];
    const questionNumber = answeredIds.length + 1;

    // Check if session is complete
    if (answeredIds.length >= attempt.total_questions) {
      return NextResponse.json({
        question: null,
        questionNumber: attempt.total_questions,
        totalQuestions: attempt.total_questions,
        isComplete: true,
      });
    }

    // Fetch the next unanswered question
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('adaimozhi')
      .select('*')
      .eq('status', 'published')
      .limit(1);

    if (answeredIds.length > 0) {
      query = query.not('id', 'in', `(${answeredIds.join(',')})`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entries, error: fetchError } = await query as { data: AdaimozhiRow[] | null; error: any };

    if (fetchError || !entries || entries.length === 0) {
      return NextResponse.json({
        question: null,
        questionNumber: attempt.total_questions,
        totalQuestions: attempt.total_questions,
        isComplete: true,
      });
    }

    const entry = entries[0];

    // Build question with distractors
    const result = await selectDistractors(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any,
      entry.id,
      entry.missing_word,
      entry.phrase_text
    );

    const mcqOptions = buildMCQOptions(entry.missing_word, result.distractors);
    const correctLabel = findCorrectLabel(mcqOptions);

    const question: AdaimozhiQuestion = {
      id: entry.id,
      type: 'adaimozhi',
      questionText: entry.phrase_text,
      options: mcqOptions.map(({ label, text }) => ({ label, text })),
      correctOption: correctLabel,
      metadata: {
        complete_phrase: entry.complete_phrase,
        meaning_ta: entry.meaning_ta,
        meaning_en: entry.meaning_en,
      },
    };

    return NextResponse.json({
      question,
      questionNumber,
      totalQuestions: attempt.total_questions,
      isComplete: false,
    });
  } catch (error) {
    console.error('[adaimozhi/next] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
