/**
 * API Route: Sorporul Questions
 * Feature: 005-sorporul
 *
 * GET - Fetch questions for practice (students) or list own questions (teachers)
 * POST - Create new question (teachers only)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import {
  GetSorporulQuestionsQuerySchema,
  CreateSorporulQuestionRequestSchema,
  ListTeacherQuestionsQuerySchema,
  type OptionLabel,
} from '@/lib/validators/sorporul';
import type { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];
type QuestionOption = Database['public']['Tables']['question_options']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * GET /api/practice/sorporul/questions
 *
 * For students: Fetch random published sorporul questions
 * For teachers: List their own sorporul questions with filters
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to determine role
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: Pick<Profile, 'role'> | null };

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const isTeacher = profile.role === 'teacher' || profile.role === 'admin';

    if (isTeacher && searchParams.has('status')) {
      // Teacher listing their own questions
      return handleTeacherList(supabase, user.id, searchParams);
    } else {
      // Student fetching practice questions
      return handleStudentFetch(supabase, searchParams);
    }
  } catch (error) {
    console.error('Sorporul questions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle student fetching practice questions
 */
async function handleStudentFetch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  searchParams: URLSearchParams
) {
  const parseResult = GetSorporulQuestionsQuerySchema.safeParse({
    limit: searchParams.get('limit') || '10',
    exclude_ids: searchParams.get('exclude_ids'),
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const { limit, exclude_ids } = parseResult.data;
  const excludeArray = exclude_ids ? exclude_ids.split(',').filter(Boolean) : [];

  // Count total available
  const { count: totalCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('section', 'sorporul')
    .eq('status', 'published');

  // Fetch random published questions
  let query = supabase
    .from('questions')
    .select('id, question_text, question_options(option_label, option_text)')
    .eq('section', 'sorporul')
    .eq('status', 'published')
    .limit(limit);

  if (excludeArray.length > 0) {
    query = query.not('id', 'in', `(${excludeArray.join(',')})`);
  }

  const { data: questions, error } = (await query) as {
    data:
      | {
          id: string;
          question_text: string;
          question_options: Pick<QuestionOption, 'option_label' | 'option_text'>[];
        }[]
      | null;
    error: unknown;
  };

  if (error) {
    console.error('Failed to fetch sorporul questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  // Transform to client format (without correct answer for students)
  const formattedQuestions = (questions || []).map((q) => ({
    id: q.id,
    targetWord: q.question_text,
    options: q.question_options
      .sort((a, b) => a.option_label.localeCompare(b.option_label))
      .map((opt) => ({
        label: opt.option_label as OptionLabel,
        text: opt.option_text,
      })),
  }));

  // Shuffle questions for randomness
  const shuffled = formattedQuestions.sort(() => Math.random() - 0.5);

  return NextResponse.json({
    questions: shuffled,
    totalAvailable: totalCount || 0,
  });
}

/**
 * Handle teacher listing their own questions
 */
async function handleTeacherList(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  searchParams: URLSearchParams
) {
  const parseResult = ListTeacherQuestionsQuerySchema.safeParse({
    status: searchParams.get('status') || 'all',
    limit: searchParams.get('limit') || '50',
    offset: searchParams.get('offset') || '0',
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const { status, limit, offset } = parseResult.data;

  // Build query for teacher's own questions
  let query = supabase
    .from('questions')
    .select('id, question_text, status, created_at, question_options(option_label, option_text, is_correct)', {
      count: 'exact',
    })
    .eq('section', 'sorporul')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: questions, error, count } = (await query) as {
    data:
      | {
          id: string;
          question_text: string;
          status: 'draft' | 'published';
          created_at: string;
          question_options: Pick<QuestionOption, 'option_label' | 'option_text' | 'is_correct'>[];
        }[]
      | null;
    error: unknown;
    count: number | null;
  };

  if (error) {
    console.error('Failed to fetch teacher questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  // Transform to teacher format (with correct answer)
  const formattedQuestions = (questions || []).map((q) => {
    const sortedOptions = q.question_options.sort((a, b) =>
      a.option_label.localeCompare(b.option_label)
    );
    const correctOption = sortedOptions.find((opt) => opt.is_correct);

    return {
      id: q.id,
      targetWord: q.question_text,
      options: sortedOptions.map((opt) => ({
        label: opt.option_label as OptionLabel,
        text: opt.option_text,
      })),
      correctAnswer: (correctOption?.option_label || 'A') as OptionLabel,
      status: q.status,
      createdAt: q.created_at,
    };
  });

  return NextResponse.json({
    questions: formattedQuestions,
    total: count || 0,
    limit,
    offset,
  });
}

/**
 * POST /api/practice/sorporul/questions
 *
 * Create a new sorporul question (teachers only)
 */
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
    const rateLimitKey = createUserRateLimitKey(user.id, 'sorporul-questions');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString() },
        }
      );
    }

    // Check teacher/admin role
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: Pick<Profile, 'role'> | null };

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = CreateSorporulQuestionRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { targetWord, correctDefinition, distractors, correctPosition, status } =
      parseResult.data;

    // Determine correct answer position (random if not specified)
    const positions: OptionLabel[] = ['A', 'B', 'C', 'D'];
    const correctLabel: OptionLabel =
      correctPosition || positions[Math.floor(Math.random() * 4)];

    // Build options array with correct answer at specified position
    const options: { label: OptionLabel; text: string; is_correct: boolean }[] = [];

    // Place correct answer at specified position
    const correctIndex = positions.indexOf(correctLabel);
    let distractorIndex = 0;

    for (let i = 0; i < 4; i++) {
      if (i === correctIndex) {
        options.push({
          label: positions[i],
          text: correctDefinition,
          is_correct: true,
        });
      } else {
        options.push({
          label: positions[i],
          text: distractors[distractorIndex],
          is_correct: false,
        });
        distractorIndex++;
      }
    }

    // Create question
    const { data: question, error: questionError } = (await supabase
      .from('questions')
      .insert({
        section: 'sorporul',
        question_text: targetWord,
        passage_id: null,
        status,
        created_by: user.id,
      } as never)
      .select()
      .single()) as { data: Question | null; error: unknown };

    if (questionError || !question) {
      console.error('Failed to create sorporul question:', questionError);
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
      console.error('Failed to create question options:', optionsError);
      // Clean up the question
      await supabase.from('questions').delete().eq('id', question.id);
      return NextResponse.json({ error: 'Failed to create question options' }, { status: 500 });
    }

    return NextResponse.json(
      {
        id: question.id,
        status: question.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sorporul questions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
