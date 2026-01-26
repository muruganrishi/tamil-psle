/**
 * API Route: /api/teacher/practice/sorporul
 * CRUD operations for sorporul questions (teacher only)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import {
  CreateSorporulQuestionRequestSchema,
  UpdateSorporulQuestionRequestSchema,
  ListSorporulQuestionsRequestSchema,
} from '@/lib/validators/practice/sorporul';
import type { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];
type QuestionOption = Database['public']['Tables']['question_options']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface QuestionWithOptions extends Question {
  question_options: QuestionOption[];
}

/**
 * GET /api/teacher/practice/sorporul
 * List sorporul questions with filtering and pagination
 */
export async function GET(request: Request) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const parseResult = ListSorporulQuestionsRequestSchema.safeParse({
      status: searchParams.get('status') || 'all',
      search: searchParams.get('search') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || '20',
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { status, search, cursor, limit } = parseResult.data;

    // Build query
    let query = supabase
      .from('questions')
      .select('*, question_options(*)', { count: 'exact' })
      .eq('section', 'sorporul')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Search filter
    if (search) {
      query = query.or(`question_text.ilike.%${search}%,metadata->targetWord.ilike.%${search}%`);
    }

    // Cursor-based pagination
    if (cursor) {
      const { data: cursorQuestion } = (await supabase
        .from('questions')
        .select('created_at')
        .eq('id', cursor)
        .single()) as { data: { created_at: string } | null };

      if (cursorQuestion) {
        query = query.lt('created_at', cursorQuestion.created_at);
      }
    }

    const { data: questions, error, count } = (await query) as {
      data: QuestionWithOptions[] | null;
      error: unknown;
      count: number | null;
    };

    if (error) {
      console.error('Failed to fetch questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const items = (questions || []).map((q) => ({
      id: q.id,
      section: q.section,
      questionText: q.question_text,
      status: q.status,
      metadata: q.metadata,
      options: q.question_options.map((opt) => ({
        label: opt.option_label,
        text: opt.option_text,
        isCorrect: opt.is_correct,
      })),
      createdAt: q.created_at,
      updatedAt: q.updated_at,
    }));

    const lastItem = items[items.length - 1];

    return NextResponse.json({
      items,
      nextCursor: items.length === limit ? lastItem?.id : null,
      hasMore: items.length === limit,
      total: count || 0,
    });
  } catch (error) {
    console.error('Teacher sorporul GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/practice/sorporul
 * Create a new sorporul question
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

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'teacher-create');
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
    const parseResult = CreateSorporulQuestionRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { targetWord, questionText, options, metadata, status } = parseResult.data;

    // Build metadata with targetWord
    const fullMetadata = {
      targetWord,
      ...metadata,
    };

    // Create the question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        section: 'sorporul',
        question_text: questionText,
        status: status,
        created_by: user.id,
        metadata: fullMetadata,
      } as never)
      .select()
      .single();

    if (questionError || !question) {
      console.error('Failed to create question:', questionError);
      return NextResponse.json(
        { error: 'Failed to create question', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Create options
    const optionInserts = options.map((opt) => ({
      question_id: (question as Question).id,
      option_label: opt.label,
      option_text: opt.text,
      is_correct: opt.isCorrect,
    }));

    const { error: optionsError } = await supabase.from('question_options').insert(optionInserts as never);

    if (optionsError) {
      // Rollback: delete the question
      await supabase.from('questions').delete().eq('id', (question as Question).id);
      console.error('Failed to create options:', optionsError);
      return NextResponse.json(
        { error: 'Failed to create question options', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const q = question as Question;
    return NextResponse.json(
      {
        id: q.id,
        section: q.section,
        questionText: q.question_text,
        status: q.status,
        metadata: q.metadata,
        createdAt: q.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Teacher sorporul POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/practice/sorporul
 * Update an existing sorporul question
 */
export async function PUT(request: Request) {
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

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'teacher-update');
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
    const parseResult = UpdateSorporulQuestionRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { id, targetWord, questionText, options, metadata, status } = parseResult.data;

    // Check if question exists and is sorporul type
    const { data: existing } = (await supabase
      .from('questions')
      .select('id, section, metadata')
      .eq('id', id)
      .single()) as { data: Question | null };

    if (!existing) {
      return NextResponse.json(
        { error: 'Question not found', code: 'QUESTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existing.section !== 'sorporul') {
      return NextResponse.json(
        { error: 'Question is not a sorporul question', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (questionText) {
      updates.question_text = questionText;
    }

    if (status) {
      updates.status = status;
    }

    // Merge metadata
    if (targetWord || metadata) {
      const existingMetadata = (existing.metadata || {}) as Record<string, unknown>;
      updates.metadata = {
        ...existingMetadata,
        ...(targetWord ? { targetWord } : {}),
        ...(metadata || {}),
      };
    }

    // Update question if there are updates
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('questions')
        .update(updates as never)
        .eq('id', id);

      if (updateError) {
        console.error('Failed to update question:', updateError);
        return NextResponse.json(
          { error: 'Failed to update question', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      }
    }

    // Update options if provided
    if (options) {
      // Delete existing options
      await supabase.from('question_options').delete().eq('question_id', id);

      // Insert new options
      const optionInserts = options.map((opt) => ({
        question_id: id,
        option_label: opt.label,
        option_text: opt.text,
        is_correct: opt.isCorrect,
      }));

      const { error: optionsError } = await supabase.from('question_options').insert(optionInserts as never);

      if (optionsError) {
        console.error('Failed to update options:', optionsError);
        return NextResponse.json(
          { error: 'Failed to update question options', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      }
    }

    // Fetch updated question
    const { data: updated } = (await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('id', id)
      .single()) as { data: QuestionWithOptions | null };

    return NextResponse.json({
      id: updated?.id,
      section: updated?.section,
      questionText: updated?.question_text,
      status: updated?.status,
      metadata: updated?.metadata,
      options: updated?.question_options.map((opt) => ({
        label: opt.option_label,
        text: opt.option_text,
        isCorrect: opt.is_correct,
      })),
      updatedAt: updated?.updated_at,
    });
  } catch (error) {
    console.error('Teacher sorporul PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/practice/sorporul
 * Delete a sorporul question
 */
export async function DELETE(request: Request) {
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

    // Get question ID from query params
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Check if question exists and is sorporul type
    const { data: existing } = (await supabase
      .from('questions')
      .select('id, section')
      .eq('id', questionId)
      .single()) as { data: Question | null };

    if (!existing) {
      return NextResponse.json(
        { error: 'Question not found', code: 'QUESTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existing.section !== 'sorporul') {
      return NextResponse.json(
        { error: 'Question is not a sorporul question', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Delete question (options will cascade delete)
    const { error: deleteError } = await supabase.from('questions').delete().eq('id', questionId);

    if (deleteError) {
      console.error('Failed to delete question:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete question', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher sorporul DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
