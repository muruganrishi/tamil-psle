import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];
type QuestionOption = Database['public']['Tables']['question_options']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const CreateQuestionSchema = z.object({
  section: z.enum([
    'vetrumai',
    'seyyul_pazhamozhi',
    'adaimozhi_echcham',
    'comprehension',
    'sorporul',
    'oli_verupaadu',
  ]),
  question_text: z.string().min(1, 'Question text is required'),
  options: z.array(z.object({
    label: z.enum(['A', 'B', 'C', 'D']),
    text: z.string().min(1),
    is_correct: z.boolean(),
  })).min(2, 'At least 2 options required'),
  passage_id: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

// GET - List questions with filters
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('questions')
      .select('*, question_options(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (section) {
      query = query.eq('section', section);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: questions, error, count } = await query as {
      data: (Question & { question_options: QuestionOption[] })[] | null;
      error: unknown;
      count: number | null;
    };

    if (error) {
      console.error('Failed to fetch questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json({
      questions: questions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin questions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new question
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'admin-questions');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.admin);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString() } }
      );
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
    const parseResult = CreateQuestionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { section, question_text, options, passage_id, status } = parseResult.data;

    // Ensure exactly one correct answer
    const correctCount = options.filter((o) => o.is_correct).length;
    if (correctCount !== 1) {
      return NextResponse.json(
        { error: 'Exactly one option must be marked as correct' },
        { status: 400 }
      );
    }

    // Create question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        section,
        question_text,
        passage_id: passage_id || null,
        status,
        created_by: user.id,
      } as never)
      .select()
      .single() as { data: Question | null; error: unknown };

    if (questionError || !question) {
      console.error('Failed to create question:', questionError);
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }

    // Create options
    const optionsData = options.map((opt) => ({
      question_id: question.id,
      option_label: opt.label,
      option_text: opt.text,
      is_correct: opt.is_correct,
    }));

    const { error: optionsError } = await supabase
      .from('question_options')
      .insert(optionsData as never);

    if (optionsError) {
      console.error('Failed to create options:', optionsError);
      // Try to clean up the question
      await supabase.from('questions').delete().eq('id', question.id);
      return NextResponse.json({ error: 'Failed to create question options' }, { status: 500 });
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Admin questions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
