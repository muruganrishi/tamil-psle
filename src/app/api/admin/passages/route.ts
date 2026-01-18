import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Passage = Database['public']['Tables']['passages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'role'> | null };

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: passages, error } = await supabase
      .from('passages')
      .select('id, title')
      .eq('status', 'published')
      .order('title') as { data: Pick<Passage, 'id' | 'title'>[] | null; error: unknown };

    if (error) {
      console.error('Failed to fetch passages:', error);
      return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 });
    }

    return NextResponse.json({ passages: passages || [] });
  } catch (error) {
    console.error('Admin passages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
