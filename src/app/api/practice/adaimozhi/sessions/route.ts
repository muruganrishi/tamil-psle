/**
 * POST /api/practice/adaimozhi/sessions - Start a new adaimozhi practice session
 * Feature: 003-adaimozhi
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  StartAdaimozhiSessionRequestSchema,
  type AdaimozhiQuestion,
} from '@/lib/validators/adaimozhi';
import {
  selectDistractors,
  buildMCQOptions,
  findCorrectLabel,
} from '@/lib/utils/adaimozhi-distractors';
import type { AdaimozhiRow, AttemptRow } from '@/types/adaimozhi';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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
    const parseResult = StartAdaimozhiSessionRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: parseResult.error.message } },
        { status: 400 }
      );
    }

    const { questionCount, assignmentId } = parseResult.data;

    // Fetch published adaimozhi entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entries, error: fetchError } = (await (supabase as any)
      .from('adaimozhi')
      .select('*')
      .eq('status', 'published')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .limit(questionCount)) as { data: AdaimozhiRow[] | null; error: any };

    if (fetchError) {
      console.error('[adaimozhi/sessions] DB error:', fetchError);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch questions' } },
        { status: 500 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: { code: 'INSUFFICIENT_CONTENT', message: 'No adaimozhi entries available' } },
        { status: 404 }
      );
    }

    // Create attempt record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attempt, error: attemptError } = (await (supabase as any)
      .from('attempts')
      .insert({
        user_id: user.id,
        section: 'adaimozhi_echcham',
        assignment_id: assignmentId || null,
        total_questions: entries.length,
      })
      .select()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single()) as { data: AttemptRow | null; error: any };

    if (attemptError || !attempt) {
      console.error('[adaimozhi/sessions] Attempt creation error:', attemptError);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' } },
        { status: 500 }
      );
    }

    // Build questions with distractors
    const questions: AdaimozhiQuestion[] = await Promise.all(
      entries.map(async (entry: AdaimozhiRow) => {
        let distractors: string[];

        // Use stored distractors if all 3 are present, otherwise auto-generate
        if (entry.distractor_1 && entry.distractor_2 && entry.distractor_3) {
          distractors = [entry.distractor_1, entry.distractor_2, entry.distractor_3];
        } else {
          const result = await selectDistractors(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            supabase as any,
            entry.id,
            entry.missing_word,
            entry.phrase_text
          );
          distractors = result.distractors;
        }

        const mcqOptions = buildMCQOptions(entry.missing_word, distractors);
        const correctLabel = findCorrectLabel(mcqOptions);

        return {
          id: entry.id,
          type: 'adaimozhi' as const,
          questionText: entry.phrase_text,
          options: mcqOptions.map(({ label, text }) => ({ label, text })),
          correctOption: correctLabel,
          metadata: {
            complete_phrase: entry.complete_phrase,
            meaning_ta: entry.meaning_ta,
            meaning_en: entry.meaning_en,
          },
        };
      })
    );

    // Shuffle questions
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      attemptId: attempt.id,
      questions: shuffledQuestions,
      totalQuestions: shuffledQuestions.length,
    });
  } catch (error) {
    console.error('[adaimozhi/sessions] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
