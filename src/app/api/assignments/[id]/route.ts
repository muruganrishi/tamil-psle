import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Assignment = Database['public']['Tables']['assignments']['Row'];

// GET - Get assignment details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single() as { data: Assignment | null; error: unknown };

    if (error || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Get user's attempts for this assignment
    const { data: attempts } = await supabase
      .from('attempts')
      .select('id, score, completed_at')
      .eq('assignment_id', assignmentId)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }) as {
        data: { id: string; score: number | null; completed_at: string | null }[] | null;
      };

    return NextResponse.json({
      assignment,
      attempts: attempts || [],
      attempts_used: (attempts || []).length,
    });
  } catch (error) {
    console.error('Assignment GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
