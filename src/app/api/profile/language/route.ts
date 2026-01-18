import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateLanguageSchema = z.object({
  ui_language: z.enum(['en', 'ta', 'both']),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = UpdateLanguageSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { ui_language } = parseResult.data;

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({ ui_language, updated_at: new Date().toISOString() } as never)
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update language preference:', error);
      return NextResponse.json(
        { error: 'Failed to update language preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ui_language });
  } catch (error) {
    console.error('Profile language API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current language preference
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('ui_language')
      .eq('id', user.id)
      .single() as { data: { ui_language: 'en' | 'ta' | 'both' } | null; error: unknown };

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch language preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ui_language: profile.ui_language });
  } catch (error) {
    console.error('Profile language API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
