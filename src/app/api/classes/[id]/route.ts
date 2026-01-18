import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Class = Database['public']['Tables']['classes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

// GET - Get class details with members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the teacher of this class or an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'role'> | null };

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get class details
    const { data: classDetails, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single() as { data: Class | null; error: unknown };

    if (classError || !classDetails) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check authorization (teacher of the class or admin)
    if (profile.role !== 'admin' && classDetails.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get class members with profiles
    const { data: members } = await supabase
      .from('class_members')
      .select('id, student_id, joined_at')
      .eq('class_id', classId)
      .order('joined_at', { ascending: false }) as {
        data: { id: string; student_id: string; joined_at: string }[] | null;
      };

    // Get profile info for each member
    const memberIds = (members || []).map((m) => m.student_id);
    const { data: profiles } = memberIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', memberIds) as { data: { id: string; display_name: string | null }[] | null }
      : { data: [] };

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const membersWithProfiles = (members || []).map((m) => ({
      ...m,
      profile: profileMap.get(m.student_id) || null,
    }));

    return NextResponse.json({
      class: classDetails,
      members: membersWithProfiles,
    });
  } catch (error) {
    console.error('Class detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
