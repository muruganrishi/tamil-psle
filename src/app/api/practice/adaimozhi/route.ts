/**
 * GET /api/practice/adaimozhi - Fetch adaimozhi questions with distractors
 * Feature: 003-adaimozhi
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  AdaimozhiQuestionsQuerySchema,
  type AdaimozhiQuestion,
} from '@/lib/validators/adaimozhi';
import {
  selectDistractors,
  buildMCQOptions,
  findCorrectLabel,
} from '@/lib/utils/adaimozhi-distractors';
import type { AdaimozhiRow } from '@/types/adaimozhi';

export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const parseResult = AdaimozhiQuestionsQuerySchema.safeParse({
      limit: searchParams.get('limit') || '10',
      exclude_ids: searchParams.get('exclude_ids'),
      assignment_id: searchParams.get('assignment_id'),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: parseResult.error.message } },
        { status: 400 }
      );
    }

    const { limit, exclude_ids } = parseResult.data;
    const excludeArray = exclude_ids?.split(',').filter(Boolean) || [];

    // Fetch published adaimozhi entries
    let query = supabase
      .from('adaimozhi')
      .select('*')
      .eq('status', 'published');

    if (excludeArray.length > 0) {
      query = query.not('id', 'in', `(${excludeArray.join(',')})`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entries, error } = await query.limit(limit) as { data: AdaimozhiRow[] | null; error: any };

    if (error) {
      console.error('[adaimozhi/route] DB error:', error);
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

    // Build questions with distractors
    let distractorSource: 'database' | 'ai_fallback' | 'mixed' = 'database';
    let anyAiUsed = false;

    const questions: AdaimozhiQuestion[] = await Promise.all(
      entries.map(async (entry: AdaimozhiRow) => {
        const result = await selectDistractors(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabase as any,
          entry.id,
          entry.missing_word,
          entry.phrase_text
        );

        if (result.aiUsed) {
          anyAiUsed = true;
        }

        const mcqOptions = buildMCQOptions(entry.missing_word, result.distractors);
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

    // Determine overall distractor source
    if (anyAiUsed) {
      distractorSource = entries.length > 3 ? 'mixed' : 'ai_fallback';
    }

    // Shuffle questions for variety
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      questions: shuffledQuestions,
      total: shuffledQuestions.length,
      distractorSource,
    });
  } catch (error) {
    console.error('[adaimozhi/route] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
