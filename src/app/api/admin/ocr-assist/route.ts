import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, createUserRateLimitKey } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

const OCR_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 10 per minute
};

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

    // Check rate limit
    const rateLimitKey = createUserRateLimitKey(user.id, 'ocr');
    const rateLimitResult = checkRateLimit(rateLimitKey, OCR_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'OCR service not configured' },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analyze this image of a Tamil language MCQ question. Extract the following information and return it in JSON format:

{
  "section": "one of: vetrumai, seyyul_pazhamozhi, adaimozhi_echcham, comprehension, sorporul, oli_verupaadu",
  "question_text": "the question text in Tamil",
  "options": [
    {"label": "A", "text": "option A text", "is_correct": true or false},
    {"label": "B", "text": "option B text", "is_correct": true or false},
    {"label": "C", "text": "option C text", "is_correct": true or false},
    {"label": "D", "text": "option D text", "is_correct": true or false}
  ]
}

Notes:
- Detect the section type based on the question content
- Preserve the original Tamil text
- If you can identify the correct answer (marked or highlighted), set is_correct to true
- If the correct answer is not clear, set all is_correct to false
- Return ONLY the JSON, no other text`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text().trim();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse OCR response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return NextResponse.json(parsed);
    } catch (error) {
      console.error('Gemini OCR error:', error);
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('OCR assist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
