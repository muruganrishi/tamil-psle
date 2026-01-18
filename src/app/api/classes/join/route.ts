import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database';

type Class = Database['public']['Tables']['classes']['Row'];
type ClassMember = Database['public']['Tables']['class_members']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const JoinClassSchema = z.object({
  join_code: z.string().length(6, 'Join code must be 6 characters'),
});

// POST - Join a class using join code
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a student
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'role'> | null };

    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join classes' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = JoinClassSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { join_code } = parseResult.data;

    // Find the class
    const { data: targetClass } = await supabase
      .from('classes')
      .select('id, name')
      .eq('join_code', join_code.toUpperCase())
      .single() as { data: Pick<Class, 'id' | 'name'> | null };

    if (!targetClass) {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('class_members')
      .select('id')
      .eq('class_id', targetClass.id)
      .eq('student_id', user.id)
      .single() as { data: Pick<ClassMember, 'id'> | null };

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this class' }, { status: 409 });
    }

    // Join the class
    const { error } = await supabase.from('class_members').insert({
      class_id: targetClass.id,
      student_id: user.id,
    } as never);

    if (error) {
      console.error('Failed to join class:', error);
      return NextResponse.json({ error: 'Failed to join class' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      class_id: targetClass.id,
      class_name: targetClass.name,
    });
  } catch (error) {
    console.error('Classes join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
