import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type Assignment = Database['public']['Tables']['assignments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type QuestionSection = Database['public']['Enums']['question_section'];

const CreateAssignmentSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  sections: z.array(z.enum([
    'vetrumai',
    'seyyul_pazhamozhi',
    'adaimozhi_echcham',
    'comprehension',
    'sorporul',
    'oli_verupaadu',
  ] as const)).min(1, 'Select at least one section'),
  question_count: z.number().int().min(1).max(20).default(5),
  max_attempts: z.number().int().min(1).max(3).default(1),
  due_date: z.string().nullable().optional(),
});

// GET - List assignments (for students: their class assignments, for teachers: their assignments)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'role'> | null };

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role === 'student') {
      // Get student's class assignments
      const { data: memberships } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('student_id', user.id) as { data: { class_id: string }[] | null };

      if (!memberships || memberships.length === 0) {
        return NextResponse.json({ assignments: [] });
      }

      const classIds = memberships.map((m) => m.class_id);

      let query = supabase
        .from('assignments')
        .select('*')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data: assignments, error } = await query as { data: Assignment[] | null; error: unknown };

      if (error) {
        console.error('Failed to fetch assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
      }

      // Get attempt counts for each assignment
      const assignmentIds = (assignments || []).map((a) => a.id);
      const { data: attempts } = assignmentIds.length > 0
        ? await supabase
            .from('attempts')
            .select('assignment_id, score')
            .eq('user_id', user.id)
            .in('assignment_id', assignmentIds) as { data: { assignment_id: string; score: number | null }[] | null }
        : { data: [] };

      const attemptMap = new Map<string, { count: number; bestScore: number | null }>();
      (attempts || []).forEach((a) => {
        const existing = attemptMap.get(a.assignment_id!);
        if (existing) {
          existing.count++;
          if (a.score !== null && (existing.bestScore === null || a.score > existing.bestScore)) {
            existing.bestScore = a.score;
          }
        } else {
          attemptMap.set(a.assignment_id!, { count: 1, bestScore: a.score });
        }
      });

      const assignmentsWithAttempts = (assignments || []).map((a) => ({
        ...a,
        attempts_used: attemptMap.get(a.id)?.count || 0,
        best_score: attemptMap.get(a.id)?.bestScore ?? null,
      }));

      return NextResponse.json({ assignments: assignmentsWithAttempts });
    } else {
      // Teacher/admin: get their created assignments
      let query = supabase
        .from('assignments')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data: assignments, error } = await query as { data: Assignment[] | null; error: unknown };

      if (error) {
        console.error('Failed to fetch assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
      }

      return NextResponse.json({ assignments: assignments || [] });
    }
  } catch (error) {
    console.error('Assignments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new assignment
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'assignments');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString() } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'role'> | null };

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Only teachers can create assignments' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = CreateAssignmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { class_id, title, sections, question_count, max_attempts, due_date } = parseResult.data;

    // Verify teacher owns this class
    const { data: targetClass } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .eq('teacher_id', user.id)
      .single();

    if (!targetClass && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Class not found or not authorized' }, { status: 404 });
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        class_id,
        created_by: user.id,
        title,
        sections: sections as QuestionSection[],
        question_count,
        max_attempts,
        due_date: due_date || null,
      } as never)
      .select()
      .single() as { data: Assignment | null; error: unknown };

    if (error) {
      console.error('Failed to create assignment:', error);
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Assignments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
