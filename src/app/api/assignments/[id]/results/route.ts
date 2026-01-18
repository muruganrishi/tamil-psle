import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Assignment = Database['public']['Tables']['assignments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Attempt = Database['public']['Tables']['attempts']['Row'];

// GET - Get assignment results for a class
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

    // Get assignment and verify teacher ownership
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single() as { data: Assignment | null; error: unknown };

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if user is the teacher or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'role'> | null };

    if (!profile || (profile.role !== 'admin' && assignment.created_by !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get class members
    const { data: members } = await supabase
      .from('class_members')
      .select('student_id, joined_at')
      .eq('class_id', assignment.class_id) as {
        data: { student_id: string; joined_at: string }[] | null;
      };

    if (!members || members.length === 0) {
      return NextResponse.json({
        assignment,
        results: [],
        summary: { total_students: 0, completed: 0, average_score: 0 },
      });
    }

    const studentIds = members.map((m) => m.student_id);

    // Get student profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', studentIds) as { data: Pick<Profile, 'id' | 'display_name'>[] | null };

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Get all attempts for this assignment
    const { data: attempts } = await supabase
      .from('attempts')
      .select('*')
      .eq('assignment_id', assignmentId)
      .in('user_id', studentIds)
      .order('completed_at', { ascending: false }) as { data: Attempt[] | null };

    // Group attempts by student and get best score
    const studentAttempts = new Map<string, { attempts: Attempt[]; best_score: number | null }>();
    (attempts || []).forEach((attempt) => {
      const existing = studentAttempts.get(attempt.user_id);
      if (existing) {
        existing.attempts.push(attempt);
        if (attempt.score !== null && (existing.best_score === null || attempt.score > existing.best_score)) {
          existing.best_score = attempt.score;
        }
      } else {
        studentAttempts.set(attempt.user_id, {
          attempts: [attempt],
          best_score: attempt.score,
        });
      }
    });

    // Build results array
    const results = members.map((member) => {
      const studentData = studentAttempts.get(member.student_id);
      const studentProfile = profileMap.get(member.student_id);

      return {
        student_id: member.student_id,
        student_name: studentProfile?.display_name || `Student ${member.student_id.slice(0, 8)}`,
        attempts_count: studentData?.attempts.length || 0,
        best_score: studentData?.best_score ?? null,
        last_attempt_at: studentData?.attempts[0]?.completed_at || null,
        completed: (studentData?.attempts.length || 0) > 0,
      };
    });

    // Calculate summary
    const completed = results.filter((r) => r.completed).length;
    const scores = results.filter((r) => r.best_score !== null).map((r) => r.best_score!);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return NextResponse.json({
      assignment,
      results,
      summary: {
        total_students: members.length,
        completed,
        average_score: Math.round(averageScore * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Assignment results error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
