import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database';

type UserSavedWord = Database['public']['Tables']['user_saved_words']['Row'];

const SaveWordSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  context: z.string().min(1, 'Context is required'),
  meaning_en: z.string().nullable(),
  meaning_ta: z.string().nullable(),
});

// GET - Fetch user's saved words
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: words, error } = await supabase
      .from('user_saved_words')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false }) as { data: UserSavedWord[] | null; error: unknown };

    if (error) {
      console.error('Failed to fetch saved words:', error);
      return NextResponse.json({ error: 'Failed to fetch saved words' }, { status: 500 });
    }

    return NextResponse.json({ words: words || [] });
  } catch (error) {
    console.error('Saved words GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save a new word
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = SaveWordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { word, context, meaning_en, meaning_ta } = parseResult.data;

    // Check if word already saved
    const { data: existing } = await supabase
      .from('user_saved_words')
      .select('id')
      .eq('user_id', user.id)
      .eq('word', word)
      .single() as { data: { id: string } | null };

    if (existing) {
      return NextResponse.json({ error: 'Word already saved' }, { status: 409 });
    }

    const { data: savedWord, error } = await supabase
      .from('user_saved_words')
      .insert({
        user_id: user.id,
        word,
        context,
        meaning_en,
        meaning_ta,
      } as never)
      .select()
      .single() as { data: UserSavedWord | null; error: unknown };

    if (error) {
      console.error('Failed to save word:', error);
      return NextResponse.json({ error: 'Failed to save word' }, { status: 500 });
    }

    return NextResponse.json({ word: savedWord }, { status: 201 });
  } catch (error) {
    console.error('Saved words POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a saved word
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get('id');

    if (!wordId) {
      return NextResponse.json({ error: 'Word ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_saved_words')
      .delete()
      .eq('id', wordId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete word:', error);
      return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Saved words DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
