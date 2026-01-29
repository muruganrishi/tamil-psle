/**
 * API Route: Generate Distractors
 * Feature: 005-sorporul
 *
 * POST - Generate AI-powered MCQ distractors for sorporul questions
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey } from '@/lib/rate-limit';
import { GenerateDistractorsRequestSchema } from '@/lib/validators/sorporul';
import { generateDistractors } from '@/lib/gemini/distractors';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Rate limit: 10 requests per minute for AI generation
const AI_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000,
};

/**
 * POST /api/practice/sorporul/generate-distractors
 *
 * Generate 3 plausible distractor definitions using AI.
 * Only available to teachers and admins.
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

    // Rate limiting - strict for AI operations
    const rateLimitKey = createUserRateLimitKey(user.id, 'sorporul-distractors');
    const rateLimitResult = checkRateLimit(rateLimitKey, AI_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before generating more distractors.',
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString() },
        }
      );
    }

    // Check teacher/admin role
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: Pick<Profile, 'role'> | null };

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = GenerateDistractorsRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { targetWord, correctDefinition } = parseResult.data;

    // Generate distractors using Gemini
    try {
      const result = await generateDistractors(targetWord, correctDefinition);

      return NextResponse.json({
        distractors: result.distractors,
        cached: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage === 'GEMINI_API_KEY is not configured') {
        return NextResponse.json(
          { error: 'AI service not configured', code: 'AI_NOT_CONFIGURED' },
          { status: 503 }
        );
      }

      if (errorMessage === 'AI_UNAVAILABLE') {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.', code: 'AI_UNAVAILABLE' },
          { status: 503 }
        );
      }

      console.error('Distractor generation error:', err);
      return NextResponse.json(
        { error: 'Failed to generate distractors', code: 'GENERATION_FAILED' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generate distractors POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
