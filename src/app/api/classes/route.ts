import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type Class = Database['public']['Tables']['classes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const CreateClassSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
});

/**
 * Generate a random 6-character join code
 */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing characters (I, O, 0, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - List teacher's classes
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a teacher or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'role'> | null };

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: classes, error } = await supabase
      .from('classes')
      .select('*, class_members(count)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false }) as {
        data: (Class & { class_members: { count: number }[] })[] | null;
        error: unknown
      };

    if (error) {
      console.error('Failed to fetch classes:', error);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    // Transform to include student count
    const classesWithCount = (classes || []).map((c) => ({
      ...c,
      student_count: c.class_members?.[0]?.count || 0,
      class_members: undefined,
    }));

    return NextResponse.json({ classes: classesWithCount });
  } catch (error) {
    console.error('Classes GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new class
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
    const rateLimitKey = createUserRateLimitKey(user.id, 'classes');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString() } }
      );
    }

    // Check if user is a teacher or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'role'> | null };

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Only teachers can create classes' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = CreateClassSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name } = parseResult.data;

    // Generate unique join code
    let joinCode = generateJoinCode();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('join_code', joinCode)
        .single();

      if (!existing) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique join code' },
        { status: 500 }
      );
    }

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: user.id,
        name,
        join_code: joinCode,
      } as never)
      .select()
      .single() as { data: Class | null; error: unknown };

    if (error) {
      console.error('Failed to create class:', error);
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error('Classes POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
