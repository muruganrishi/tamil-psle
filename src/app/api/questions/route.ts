import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QuestionsQuerySchema } from '@/lib/validators/questions';
import type { Question, QuestionOption, Passage } from '@/types/database';

// Type for the query result with relations
type QuestionWithRelations = Question & {
  passage: Passage | null;
  options: QuestionOption[];
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const parseResult = QuestionsQuerySchema.safeParse({
      section: searchParams.get('section'),
      limit: searchParams.get('limit') || '10',
      exclude_ids: searchParams.get('exclude_ids'),
      assignment_id: searchParams.get('assignment_id'),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { section, limit, exclude_ids } = parseResult.data;

    // Build query for questions
    let query = supabase
      .from('questions')
      .select(
        `
        id,
        section,
        question_text,
        passage:passages (
          id,
          title,
          content
        ),
        options:question_options (
          option_label,
          option_text
        )
      `
      )
      .eq('section', section)
      .eq('status', 'published');

    // Exclude already answered questions if provided
    if (exclude_ids) {
      const excludeArray = exclude_ids.split(',').filter(Boolean);
      if (excludeArray.length > 0) {
        query = query.not('id', 'in', `(${excludeArray.join(',')})`);
      }
    }

    // Get total count first
    const { count: totalAvailable } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('section', section)
      .eq('status', 'published');

    // Fetch questions with random ordering for variety
    const { data: questions, error } = await query.limit(limit) as { data: QuestionWithRelations[] | null; error: unknown };

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected response format
    const formattedQuestions = (questions || []).map((q) => ({
      id: q.id,
      section: q.section,
      question_text: q.question_text,
      passage: q.passage,
      options: (q.options || [])
        .sort((a, b) => a.option_label.localeCompare(b.option_label))
        .map((opt) => ({
          label: opt.option_label,
          text: opt.option_text,
        })),
    }));

    // Shuffle questions for variety
    const shuffledQuestions = formattedQuestions.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      questions: shuffledQuestions,
      total_available: totalAvailable || 0,
    });
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
