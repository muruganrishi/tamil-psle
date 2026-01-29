/**
 * API Route: Sorporul Question by ID
 * Feature: 005-sorporul
 *
 * PATCH - Update question status (publish/unpublish)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { UpdateQuestionStatusRequestSchema } from '@/lib/validators/sorporul';
import type { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/practice/sorporul/questions/[id]
 *
 * Update question status (publish/unpublish)
 * Only the creator (teacher) or admin can update
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'sorporul-questions-update');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const parseResult = UpdateQuestionStatusRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status } = parseResult.data;

    // Fetch the question to verify ownership
    const { data: existingQuestion } = (await supabase
      .from('questions')
      .select('id, created_by, section')
      .eq('id', id)
      .single()) as { data: Pick<Question, 'id' | 'created_by' | 'section'> | null };

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Verify it's a sorporul question
    if (existingQuestion.section !== 'sorporul') {
      return NextResponse.json({ error: 'Invalid question type' }, { status: 400 });
    }

    // Verify ownership (unless admin)
    if (profile.role !== 'admin' && existingQuestion.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the question status
    const { data: updatedQuestion, error: updateError } = (await supabase
      .from('questions')
      .update({ status } as never)
      .eq('id', id)
      .select('id, status')
      .single()) as { data: Pick<Question, 'id' | 'status'> | null; error: unknown };

    if (updateError || !updatedQuestion) {
      console.error('Failed to update question status:', updateError);
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }

    return NextResponse.json({
      id: updatedQuestion.id,
      status: updatedQuestion.status,
    });
  } catch (error) {
    console.error('Sorporul question PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
