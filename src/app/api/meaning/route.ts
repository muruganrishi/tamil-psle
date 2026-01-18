import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getContextualMeaning } from '@/lib/gemini/client';
import {
  checkRateLimit,
  MEANING_RATE_LIMIT,
  createUserRateLimitKey,
} from '@/lib/rate-limit';
import { MeaningRequestSchema } from '@/lib/validators/meaning';
import type { Database } from '@/types/database';

type WordSenseCache = Database['public']['Tables']['word_sense_cache']['Row'];

/**
 * Create a hash for context to use in cache lookup
 * Using a simple hash for demonstration - in production use crypto
 */
function hashContext(context: string): string {
  let hash = 0;
  for (let i = 0; i < context.length; i++) {
    const char = context.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Normalize a Tamil word for cache lookup
 */
function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = MeaningRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: parseResult.error.errors[0].message,
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    const { word, context, language_mode } = parseResult.data;

    // Check rate limit
    const rateLimitKey = createUserRateLimitKey(user.id, 'meaning');
    const rateLimitResult = checkRateLimit(rateLimitKey, MEANING_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Please wait a moment before looking up more words',
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
          },
        }
      );
    }

    // Check cache first
    const wordNormalized = normalizeWord(word);
    const contextHash = hashContext(context);

    const { data: cachedResult } = await supabase
      .from('word_sense_cache')
      .select('*')
      .eq('word_normalized', wordNormalized)
      .eq('context_hash', contextHash)
      .eq('language_mode', language_mode)
      .single() as { data: WordSenseCache | null };

    if (cachedResult) {
      return NextResponse.json({
        word,
        meaning_en: cachedResult.meaning_en,
        meaning_ta: cachedResult.meaning_ta,
        cached: true,
      });
    }

    // Call Gemini API
    try {
      const meaning = await getContextualMeaning(word, context, language_mode);

      // Cache the result
      await supabase.from('word_sense_cache').insert({
        word_normalized: wordNormalized,
        context_hash: contextHash,
        language_mode: language_mode,
        meaning_en: meaning.meaning_en,
        meaning_ta: meaning.meaning_ta,
      } as never);

      return NextResponse.json({
        word,
        meaning_en: meaning.meaning_en,
        meaning_ta: meaning.meaning_ta,
        cached: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'AI_UNAVAILABLE') {
        return NextResponse.json(
          {
            error: 'AI service is temporarily unavailable',
            code: 'AI_UNAVAILABLE',
          },
          { status: 503 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Meaning API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INVALID_REQUEST' },
      { status: 500 }
    );
  }
}
