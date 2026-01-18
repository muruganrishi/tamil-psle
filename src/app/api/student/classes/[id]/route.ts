import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE - Leave a class
export async function DELETE(
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

    // Delete the membership
    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', user.id);

    if (error) {
      console.error('Failed to leave class:', error);
      return NextResponse.json({ error: 'Failed to leave class' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leave class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
