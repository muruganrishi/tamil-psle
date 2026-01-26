/**
 * API Route: /api/teacher/practice/sorporul/ai-generate
 * AI-assisted distractor generation for sorporul questions
 */

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { GenerateDistractorsRequestSchema } from '@/lib/validators/practice/sorporul';
import { createHash } from 'crypto';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AICache = Database['public']['Tables']['ai_generation_cache']['Row'];

interface DistractorResult {
  text: string;
  rationale?: string;
}

interface GenerationOutput {
  distractors: DistractorResult[];
}

/**
 * Generate cache key hash from input parameters
 */
function generateInputHash(input: Record<string, unknown>): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort());
  return createHash('sha256').update(normalized).digest('hex').substring(0, 32);
}

/**
 * POST /api/teacher/practice/sorporul/ai-generate
 * Generate plausible distractor definitions using AI
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

    // Check if user is teacher or admin
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: Profile | null };

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    // Rate limiting (AI calls are expensive)
    const rateLimitKey = createUserRateLimitKey(user.id, 'ai-generate');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.meaning);

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
    const parseResult = GenerateDistractorsRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { targetWord, correctMeaning, count, wordClass, meaningLanguage } = parseResult.data;

    // Check cache first
    const cacheInput = { targetWord, correctMeaning, count, wordClass, meaningLanguage };
    const inputHash = generateInputHash(cacheInput);

    const { data: cached } = (await supabase
      .from('ai_generation_cache')
      .select('output_json')
      .eq('task', 'sorporul_distractors')
      .eq('input_hash', inputHash)
      .single()) as { data: AICache | null };

    if (cached) {
      const output = cached.output_json as unknown as GenerationOutput;
      return NextResponse.json({
        distractors: output.distractors,
        cached: true,
      });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured', code: 'AI_GENERATION_FAILED' },
        { status: 503 }
      );
    }

    // Generate distractors using Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const languageInstruction = meaningLanguage === 'ta'
      ? 'in Tamil script (தமிழ்)'
      : 'in English';

    const wordClassHint = wordClass
      ? `The word is a ${wordClass}.`
      : '';

    const prompt = `You are a Tamil language education expert creating multiple choice questions for PSLE Tamil vocabulary (சொற்பொருள்).

Target word: ${targetWord}
Correct meaning: ${correctMeaning}
${wordClassHint}

Generate exactly ${count} WRONG but plausible distractor meanings ${languageInstruction} for this word.

Requirements for good distractors:
1. They should be believable - related concepts or common confusions
2. They should be the same type (if correct is a definition, distractors should be definitions)
3. They should NOT be synonyms of the correct answer
4. They should be approximately the same length as the correct answer
5. For Tamil distractors, use proper Tamil script

Return ONLY a JSON array with this exact format (no markdown, no explanation):
[
  {"text": "distractor meaning 1", "rationale": "why this is a good distractor"},
  {"text": "distractor meaning 2", "rationale": "why this is a good distractor"}
]`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse JSON response
      let distractors: DistractorResult[];
      try {
        distractors = JSON.parse(text);

        // Validate structure
        if (!Array.isArray(distractors)) {
          throw new Error('Response is not an array');
        }

        distractors = distractors.map((d) => ({
          text: String(d.text || ''),
          rationale: d.rationale ? String(d.rationale) : undefined,
        })).filter((d) => d.text.length > 0);

        if (distractors.length === 0) {
          throw new Error('No valid distractors generated');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', text, parseError);
        return NextResponse.json(
          { error: 'AI generated invalid response format', code: 'AI_GENERATION_FAILED' },
          { status: 500 }
        );
      }

      // Cache the result
      const output: GenerationOutput = { distractors };

      await supabase.from('ai_generation_cache').upsert(
        {
          task: 'sorporul_distractors',
          input_hash: inputHash,
          output_json: output as never,
          model: 'gemini-1.5-flash',
        } as never,
        { onConflict: 'task,input_hash' }
      );

      return NextResponse.json({
        distractors,
        cached: false,
      });
    } catch (aiError) {
      console.error('Gemini API error:', aiError);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable', code: 'AI_GENERATION_FAILED' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('AI generate distractors error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
