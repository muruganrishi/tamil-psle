/**
 * GET/POST /api/teacher/practice/adaimozhi - List and create adaimozhi entries
 * Feature: 003-adaimozhi
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ListEntriesQuerySchema,
  CreateEntryRequestSchema,
} from '@/lib/validators/adaimozhi';
import type { AdaimozhiRow, ProfileRow } from '@/types/adaimozhi';

/**
 * GET - List adaimozhi entries for the current teacher
 */
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

    // Check teacher role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: ProfileRow | null };

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Teacher access required' } },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const parseResult = ListEntriesQuerySchema.safeParse({
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
      search: searchParams.get('search') || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: parseResult.error.message } },
        { status: 400 }
      );
    }

    const { status, limit, offset, search } = parseResult.data;

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('adaimozhi')
      .select('*', { count: 'exact' })
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`phrase_text.ilike.%${search}%,missing_word.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entries, error: fetchError, count } = await query as { data: AdaimozhiRow[] | null; error: any; count: number | null };

    if (fetchError) {
      console.error('[teacher/adaimozhi] Fetch error:', fetchError);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch entries' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entries: entries || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[teacher/adaimozhi] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new adaimozhi entry
 */
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

    // Check teacher role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: ProfileRow | null };

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Teacher access required' } },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parseResult = CreateEntryRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: parseResult.error.message } },
        { status: 400 }
      );
    }

    const { phrase_text, missing_word, complete_phrase, meaning_ta, meaning_en, status } =
      parseResult.data;

    // Check for duplicates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('adaimozhi')
      .select('id')
      .eq('missing_word', missing_word)
      .eq('complete_phrase', complete_phrase)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_ENTRY', message: 'This entry already exists' } },
        { status: 409 }
      );
    }

    // Create entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: insertError } = (await (supabase as any)
      .from('adaimozhi')
      .insert({
        phrase_text,
        missing_word,
        complete_phrase,
        meaning_ta: meaning_ta || null,
        meaning_en: meaning_en || null,
        status,
        created_by: user.id,
      })
      .select()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single()) as { data: AdaimozhiRow | null; error: any };

    if (insertError) {
      console.error('[teacher/adaimozhi] Insert error:', insertError);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create entry' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('[teacher/adaimozhi] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
