import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ClassMember = Database['public']['Tables']['class_members']['Row'];
type Class = Database['public']['Tables']['classes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

// GET - List student's enrolled classes
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student's class memberships
    const { data: memberships, error } = await supabase
      .from('class_members')
      .select('class_id, joined_at')
      .eq('student_id', user.id)
      .order('joined_at', { ascending: false }) as {
        data: Pick<ClassMember, 'class_id' | 'joined_at'>[] | null;
        error: unknown;
      };

    if (error) {
      console.error('Failed to fetch memberships:', error);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ classes: [] });
    }

    const classIds = memberships.map((m) => m.class_id);

    // Get class details
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, teacher_id')
      .in('id', classIds) as { data: Pick<Class, 'id' | 'name' | 'teacher_id'>[] | null };

    // Get teacher names
    const teacherIds = [...new Set((classes || []).map((c) => c.teacher_id))];
    const { data: teachers } = teacherIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', teacherIds) as { data: Pick<Profile, 'id' | 'display_name'>[] | null }
      : { data: [] };

    const teacherMap = new Map((teachers || []).map((t) => [t.id, t.display_name]));
    const classMap = new Map((classes || []).map((c) => [c.id, c]));

    const studentClasses = memberships.map((m) => {
      const cls = classMap.get(m.class_id);
      return {
        id: m.class_id,
        name: cls?.name || 'Unknown Class',
        teacher_name: cls ? teacherMap.get(cls.teacher_id) : null,
        joined_at: m.joined_at,
      };
    });

    return NextResponse.json({ classes: studentClasses });
  } catch (error) {
    console.error('Student classes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
