import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

const ImportQuestionSchema = z.object({
  section: z.enum([
    'vetrumai',
    'seyyul_pazhamozhi',
    'adaimozhi_echcham',
    'comprehension',
    'sorporul',
    'oli_verupaadu',
  ]),
  question_text: z.string().min(1),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().optional().default(''),
  option_d: z.string().optional().default(''),
  correct_option: z.enum(['A', 'B', 'C', 'D']),
});

const ImportRequestSchema = z.object({
  questions: z.array(ImportQuestionSchema),
  status: z.enum(['draft', 'published']).default('draft'),
});

// POST - Import multiple questions from CSV
export async function POST(request: Request) {
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

    const body = await request.json();
    const parseResult = ImportRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { questions, status } = parseResult.data;

    let imported = 0;
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      try {
        // Create question
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            section: q.section,
            question_text: q.question_text,
            status,
            created_by: user.id,
          } as never)
          .select()
          .single();

        if (questionError || !question) {
          throw new Error('Failed to create question');
        }

        // Create options
        const options = [
          { label: 'A' as const, text: q.option_a },
          { label: 'B' as const, text: q.option_b },
          { label: 'C' as const, text: q.option_c },
          { label: 'D' as const, text: q.option_d },
        ].filter((opt) => opt.text);

        const optionsData = options.map((opt) => ({
          question_id: (question as { id: string }).id,
          option_label: opt.label,
          option_text: opt.text,
          is_correct: opt.label === q.correct_option,
        }));

        const { error: optionsError } = await supabase
          .from('question_options')
          .insert(optionsData as never);

        if (optionsError) {
          // Clean up question
          await supabase.from('questions').delete().eq('id', (question as { id: string }).id);
          throw new Error('Failed to create options');
        }

        imported++;
      } catch (err) {
        failed++;
        errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      failed,
      errors: errors.slice(0, 10), // Limit error details
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
