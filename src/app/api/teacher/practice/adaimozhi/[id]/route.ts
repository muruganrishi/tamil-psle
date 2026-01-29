/**
 * GET/PATCH/DELETE /api/teacher/practice/adaimozhi/[id] - Single entry operations
 * Feature: 003-adaimozhi
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateEntryRequestSchema } from '@/lib/validators/adaimozhi';
import type { AdaimozhiRow, ProfileRow } from '@/types/adaimozhi';

/**
 * GET - Get a single adaimozhi entry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Fetch entry (teacher can only see their own entries)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: fetchError } = (await (supabase as any)
      .from('adaimozhi')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single()) as { data: AdaimozhiRow | null; error: any };

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('[teacher/adaimozhi/[id]] GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update an adaimozhi entry
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
    const parseResult = UpdateEntryRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: parseResult.error.message } },
        { status: 400 }
      );
    }

    // Check entry exists and belongs to user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('adaimozhi')
      .select('id, created_by')
      .eq('id', id)
      .single() as { data: { id: string; created_by: string } | null };

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 }
      );
    }

    if (existing.created_by !== user.id && profile.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only edit your own entries' } },
        { status: 403 }
      );
    }

    // Check for duplicate if changing unique fields
    const updateData = parseResult.data;
    if (updateData.missing_word || updateData.complete_phrase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: duplicate } = await (supabase as any)
        .from('adaimozhi')
        .select('id')
        .eq('missing_word', updateData.missing_word || '')
        .eq('complete_phrase', updateData.complete_phrase || '')
        .neq('id', id)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_ENTRY', message: 'This entry already exists' } },
          { status: 409 }
        );
      }
    }

    // Update entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: updateError } = (await (supabase as any)
      .from('adaimozhi')
      .update(updateData)
      .eq('id', id)
      .select()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single()) as { data: AdaimozhiRow | null; error: any };

    if (updateError) {
      console.error('[teacher/adaimozhi/[id]] Update error:', updateError);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update entry' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('[teacher/adaimozhi/[id]] PATCH error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete an adaimozhi entry (drafts only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Check entry exists, is draft, and belongs to user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('adaimozhi')
      .select('id, status, created_by')
      .eq('id', id)
      .single() as { data: { id: string; status: string; created_by: string } | null };

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 }
      );
    }

    if (existing.created_by !== user.id && profile.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only delete your own entries' } },
        { status: 403 }
      );
    }

    if (existing.status !== 'draft' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only draft entries can be deleted' } },
        { status: 403 }
      );
    }

    // Delete entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any).from('adaimozhi').delete().eq('id', id);

    if (deleteError) {
      console.error('[teacher/adaimozhi/[id]] Delete error:', deleteError);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete entry' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('[teacher/adaimozhi/[id]] DELETE error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
