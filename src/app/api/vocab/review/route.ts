/**
 * API Route: /api/vocab/review
 * Spaced repetition review management
 *
 * READ-ONLY for feature agents (shared infrastructure)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';

// Type for vocab review row
interface VocabReviewRow {
  user_id: string;
  word: string;
  next_review_at: string;
  interval_days: number;
  ease: number;
  last_result: string | null;
  created_at: string;
}

// Validation schemas
const GetReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const SubmitReviewSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  result: z.enum(['easy', 'good', 'hard', 'again']),
});

/**
 * SM-2 algorithm parameters for spaced repetition
 */
const SM2 = {
  MIN_EASE: 1.3,
  MAX_EASE: 2.5,
  DEFAULT_EASE: 2.5,
  AGAIN_INTERVAL: 1, // 1 day (actually minutes for testing, but stored as days)
  HARD_MULTIPLIER: 1.2,
  GOOD_MULTIPLIER: 1.0,
  EASY_MULTIPLIER: 1.3,
  EASY_BONUS: 0.15,
  HARD_PENALTY: 0.15,
  AGAIN_PENALTY: 0.2,
};

/**
 * Calculate next review interval and ease based on result
 */
function calculateNextReview(
  currentIntervalDays: number,
  currentEase: number,
  result: 'easy' | 'good' | 'hard' | 'again'
): { intervalDays: number; ease: number; nextReviewAt: Date } {
  let newInterval: number;
  let newEase: number;

  switch (result) {
    case 'again':
      // Reset to 1 day, decrease ease
      newInterval = SM2.AGAIN_INTERVAL;
      newEase = Math.max(SM2.MIN_EASE, currentEase - SM2.AGAIN_PENALTY);
      break;

    case 'hard':
      // Increase interval slightly, decrease ease
      newInterval = Math.max(1, Math.round(currentIntervalDays * SM2.HARD_MULTIPLIER));
      newEase = Math.max(SM2.MIN_EASE, currentEase - SM2.HARD_PENALTY);
      break;

    case 'good':
      // Normal progression
      newInterval = currentIntervalDays === 0 ? 1 : Math.round(currentIntervalDays * currentEase);
      newEase = currentEase; // No change
      break;

    case 'easy':
      // Faster progression, increase ease
      newInterval =
        currentIntervalDays === 0
          ? 4
          : Math.round(currentIntervalDays * currentEase * SM2.EASY_MULTIPLIER);
      newEase = Math.min(SM2.MAX_EASE, currentEase + SM2.EASY_BONUS);
      break;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    intervalDays: newInterval,
    ease: newEase,
    nextReviewAt,
  };
}

/**
 * GET /api/vocab/review
 * Get words due for review
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const parseResult = GetReviewsQuerySchema.safeParse({
      limit: searchParams.get('limit') ?? '10',
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { limit } = parseResult.data;

    // Get words due for review (next_review_at <= now)
    const { data: reviews, error } = (await supabase
      .from('user_vocab_reviews')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(limit)) as { data: VocabReviewRow[] | null; error: unknown };

    if (error) {
      console.error('Failed to fetch reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reviews: reviews || [],
      count: reviews?.length || 0,
    });
  } catch (error) {
    console.error('Vocab review GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vocab/review
 * Submit a review result
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'vocab-review');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
          },
        }
      );
    }

    // Parse body
    const body = await request.json();
    const parseResult = SubmitReviewSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { word, result } = parseResult.data;

    // Get current review state
    const { data: existing } = (await supabase
      .from('user_vocab_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('word', word)
      .single()) as { data: VocabReviewRow | null };

    // Calculate next review
    const currentInterval = existing?.interval_days ?? 0;
    const currentEase = existing?.ease ?? SM2.DEFAULT_EASE;
    const { intervalDays, ease, nextReviewAt } = calculateNextReview(
      currentInterval,
      currentEase,
      result
    );

    // Upsert review record
    const { data: updated, error } = (await supabase
      .from('user_vocab_reviews')
      .upsert(
        {
          user_id: user.id,
          word,
          next_review_at: nextReviewAt.toISOString(),
          interval_days: intervalDays,
          ease,
          last_result: result,
        } as never,
        { onConflict: 'user_id,word' }
      )
      .select()
      .single()) as { data: VocabReviewRow | null; error: unknown };

    if (error) {
      console.error('Failed to update review:', error);
      return NextResponse.json(
        { error: 'Failed to update review', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      word: updated?.word,
      next_review_at: updated?.next_review_at,
      interval_days: updated?.interval_days,
      ease: updated?.ease,
    });
  } catch (error) {
    console.error('Vocab review POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
