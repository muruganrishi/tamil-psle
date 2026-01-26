/**
 * API Route: /api/teacher/practice/sorporul/import
 * Bulk import sorporul questions from CSV data
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey } from '@/lib/rate-limit';
import { SorporulBulkImportRequestSchema, SorporulCSVRowSchema } from '@/lib/validators/practice/sorporul';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

interface ImportResult {
  row: number;
  success: boolean;
  questionId?: string;
  error?: string;
}

/**
 * POST /api/teacher/practice/sorporul/import
 * Bulk import questions from structured data (CSV format)
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

    // Rate limiting (more restrictive for bulk operations)
    const rateLimitKey = createUserRateLimitKey(user.id, 'teacher-import');
    const rateLimitResult = checkRateLimit(rateLimitKey, {
      maxRequests: 5,
      windowMs: 60 * 1000, // 5 imports per minute
    });

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
    const parseResult = SorporulBulkImportRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { questions, publishImmediately } = parseResult.data;
    const results: ImportResult[] = [];
    let successful = 0;
    let failed = 0;

    // Process each row
    for (let i = 0; i < questions.length; i++) {
      const row = questions[i];
      const rowNumber = i + 1;

      try {
        // Validate the row
        const rowValidation = SorporulCSVRowSchema.safeParse(row);
        if (!rowValidation.success) {
          results.push({
            row: rowNumber,
            success: false,
            error: rowValidation.error.errors[0].message,
          });
          failed++;
          continue;
        }

        const validRow = rowValidation.data;

        // Build metadata
        const metadata: Record<string, unknown> = {
          targetWord: validRow.targetWord,
        };

        if (validRow.wordClass) {
          metadata.wordClass = validRow.wordClass;
        }
        if (validRow.exampleSentence) {
          metadata.exampleSentence = validRow.exampleSentence;
        }
        if (validRow.difficulty) {
          metadata.difficulty = validRow.difficulty;
        }
        if (validRow.tags) {
          metadata.tags = validRow.tags.split(',').map((t) => t.trim()).filter(Boolean);
        }

        // Create the question
        const { data: question, error: questionError } = (await supabase
          .from('questions')
          .insert({
            section: 'sorporul',
            question_text: validRow.questionText,
            status: publishImmediately ? 'published' : 'draft',
            created_by: user.id,
            metadata,
          } as never)
          .select()
          .single()) as { data: Question | null; error: unknown };

        if (questionError || !question) {
          results.push({
            row: rowNumber,
            success: false,
            error: 'Failed to create question',
          });
          failed++;
          continue;
        }

        // Create options
        const options = [
          { label: 'A', text: validRow.optionA, isCorrect: validRow.correctAnswer === 'A' },
          { label: 'B', text: validRow.optionB, isCorrect: validRow.correctAnswer === 'B' },
          { label: 'C', text: validRow.optionC, isCorrect: validRow.correctAnswer === 'C' },
          { label: 'D', text: validRow.optionD, isCorrect: validRow.correctAnswer === 'D' },
        ];

        const optionInserts = options.map((opt) => ({
          question_id: question.id,
          option_label: opt.label,
          option_text: opt.text,
          is_correct: opt.isCorrect,
        }));

        const { error: optionsError } = await supabase.from('question_options').insert(optionInserts as never);

        if (optionsError) {
          // Rollback: delete the question
          await supabase.from('questions').delete().eq('id', question.id);
          results.push({
            row: rowNumber,
            success: false,
            error: 'Failed to create question options',
          });
          failed++;
          continue;
        }

        results.push({
          row: rowNumber,
          success: true,
          questionId: question.id,
        });
        successful++;
      } catch (err) {
        results.push({
          row: rowNumber,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        failed++;
      }
    }

    return NextResponse.json({
      total: questions.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('Teacher sorporul import error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
