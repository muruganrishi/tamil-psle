/**
 * POST /api/practice/adaimozhi/sessions/[attemptId]/submit - Submit answer for current question
 * Feature: 003-adaimozhi
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubmitAnswerRequestSchema, type AdaimozhiQuestion } from '@/lib/validators/adaimozhi';
import {
  selectDistractors,
  buildMCQOptions,
  findCorrectLabel,
} from '@/lib/utils/adaimozhi-distractors';
import type { AdaimozhiRow, AttemptRow, AttemptAnswerRow } from '@/types/adaimozhi';

export async function POST(
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

    // Parse and validate request body
    const body = await request.json();
    const parseResult = SubmitAnswerRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: parseResult.error.message } },
        { status: 400 }
      );
    }

    const { adaimozhiId, selectedOption } = parseResult.data;

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

    // Fetch the adaimozhi entry to check answer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: entryError } = (await (supabase as any)
      .from('adaimozhi')
      .select('*')
      .eq('id', adaimozhiId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single()) as { data: AdaimozhiRow | null; error: any };

    if (entryError || !entry) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      );
    }

    // Build the options to determine the correct label
    const distractorResult = await selectDistractors(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any,
      entry.id,
      entry.missing_word,
      entry.phrase_text
    );
    const mcqOptions = buildMCQOptions(entry.missing_word, distractorResult.distractors);
    const correctLabel = findCorrectLabel(mcqOptions);

    // Check if the answer is correct
    const isCorrect = selectedOption === correctLabel;

    // Save the answer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: answerError } = await (supabase as any).from('attempt_answers').insert({
      attempt_id: attemptId,
      adaimozhi_id: adaimozhiId,
      selected_option: selectedOption,
      is_correct: isCorrect,
    });

    if (answerError) {
      console.error('[adaimozhi/submit] Answer save error:', answerError);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to save answer' } },
        { status: 500 }
      );
    }

    // Get total answered for this attempt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: answeredCount } = await (supabase as any)
      .from('attempt_answers')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attemptId);

    const questionNumber = answeredCount || 1;
    const isComplete = questionNumber >= attempt.total_questions;

    // If complete, update attempt
    if (isComplete) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: correctCount } = await (supabase as any)
        .from('attempt_answers')
        .select('*', { count: 'exact', head: true })
        .eq('attempt_id', attemptId)
        .eq('is_correct', true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('attempts')
        .update({
          completed_at: new Date().toISOString(),
          score: correctCount || 0,
        })
        .eq('id', attemptId);
    }

    // Get next question if not complete
    let nextQuestion: AdaimozhiQuestion | null = null;

    if (!isComplete) {
      // Get already answered IDs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: answered } = await (supabase as any)
        .from('attempt_answers')
        .select('adaimozhi_id')
        .eq('attempt_id', attemptId)
        .not('adaimozhi_id', 'is', null) as { data: AttemptAnswerRow[] | null };

      const answeredIds = (answered || []).map((a) => a.adaimozhi_id).filter(Boolean) as string[];

      // Fetch next unanswered
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let nextQuery = (supabase as any)
        .from('adaimozhi')
        .select('*')
        .eq('status', 'published')
        .limit(1);

      if (answeredIds.length > 0) {
        nextQuery = nextQuery.not('id', 'in', `(${answeredIds.join(',')})`);
      }

      const { data: nextEntries } = await nextQuery as { data: AdaimozhiRow[] | null };

      if (nextEntries && nextEntries.length > 0) {
        const nextEntry = nextEntries[0];
        const nextResult = await selectDistractors(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabase as any,
          nextEntry.id,
          nextEntry.missing_word,
          nextEntry.phrase_text
        );
        const nextOptions = buildMCQOptions(nextEntry.missing_word, nextResult.distractors);
        const nextCorrectLabel = findCorrectLabel(nextOptions);

        nextQuestion = {
          id: nextEntry.id,
          type: 'adaimozhi',
          questionText: nextEntry.phrase_text,
          options: nextOptions.map(({ label, text }) => ({ label, text })),
          correctOption: nextCorrectLabel,
          metadata: {
            complete_phrase: nextEntry.complete_phrase,
            meaning_ta: nextEntry.meaning_ta,
            meaning_en: nextEntry.meaning_en,
          },
        };
      }
    }

    return NextResponse.json({
      isCorrect,
      correctOption: correctLabel,
      metadata: {
        complete_phrase: entry.complete_phrase,
        meaning_ta: entry.meaning_ta,
        meaning_en: entry.meaning_en,
      },
      nextQuestion,
      questionNumber,
      totalQuestions: attempt.total_questions,
      isComplete,
    });
  } catch (error) {
    console.error('[adaimozhi/submit] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
