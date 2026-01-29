# Quickstart: Adaimozhi Feature Implementation

**Feature**: 003-adaimozhi | **Date**: 2026-01-27

## Prerequisites

- Node.js 18+ installed
- Supabase CLI installed (`npm install -g supabase`)
- Local Supabase instance running (`supabase start`)
- Existing TamilPSLE app with shared infrastructure

## Quick Setup

### 1. Apply Database Migration

```bash
# From project root
supabase migration new adaimozhi

# Copy migration content from specs/003-adaimozhi/data-model.md
# to supabase/migrations/[timestamp]_adaimozhi.sql

# Apply migration
supabase db push
```

### 2. Create Validator File

```bash
# Create the validators file
touch src/lib/validators/practice/adaimozhi.ts
```

Copy content from `specs/003-adaimozhi/contracts/` into the validator file, adapting for runtime use.

### 3. Verify Shared Components Exist

```bash
# These should already exist (READ-ONLY)
ls src/components/practice/
# Expected: QuestionShell.tsx, MCQOptions.tsx, ProgressIndicator.tsx, WordGlossaryPopover.tsx

ls src/hooks/practice/
# Expected: usePracticeSession.ts
```

## Implementation Order

### Phase 1: Database & Validators (Day 1)
1. ✅ Migration file: `supabase/migrations/008_adaimozhi.sql`
2. ✅ Validators: `src/lib/validators/practice/adaimozhi.ts`

### Phase 2: Student Practice API (Day 1-2)
1. `src/app/api/practice/adaimozhi/route.ts` - GET questions
2. `src/app/api/practice/adaimozhi/sessions/route.ts` - POST start session
3. `src/app/api/practice/adaimozhi/sessions/[attemptId]/next/route.ts` - GET next question
4. `src/app/api/practice/adaimozhi/sessions/[attemptId]/submit/route.ts` - POST submit answer

### Phase 3: Student Practice UI (Day 2)
1. `src/components/adaimozhi/AdaimozhiQuestionCard.tsx`
2. `src/components/adaimozhi/index.ts`
3. `src/app/(dashboard)/practice/adaimozhi/page.tsx`

### Phase 4: Teacher APIs (Day 3)
1. `src/app/api/teacher/practice/adaimozhi/route.ts` - CRUD
2. `src/app/api/teacher/practice/adaimozhi/[id]/route.ts` - Single entry
3. `src/app/api/teacher/practice/adaimozhi/import/route.ts` - CSV import
4. `src/app/api/teacher/practice/adaimozhi/generate/route.ts` - AI generation

### Phase 5: Teacher UI (Day 3-4)
1. `src/app/(dashboard)/teacher/practice/adaimozhi/page.tsx` - List
2. `src/app/(dashboard)/teacher/practice/adaimozhi/new/page.tsx` - Create form
3. `src/app/(dashboard)/teacher/practice/adaimozhi/import/page.tsx` - CSV import
4. `src/components/adaimozhi/AdaimozhiForm.tsx`
5. `src/components/adaimozhi/AdaimozhiPreview.tsx`
6. `src/components/adaimozhi/CSVImportPreview.tsx`

### Phase 6: Testing (Day 4-5)
1. `tests/e2e/adaimozhi.spec.ts`
2. Seed test data
3. Manual verification

## Key Files Reference

### Student Practice Page (Example)

```typescript
// src/app/(dashboard)/practice/adaimozhi/page.tsx
'use client';

import { usePracticeSession } from '@/hooks/practice';
import { QuestionShell, MCQOptions, ProgressIndicator } from '@/components/practice';
import { AdaimozhiQuestionCard } from '@/components/adaimozhi';

export default function AdaimozhiPracticePage() {
  const session = usePracticeSession({
    section: 'adaimozhi_echcham',
    apiBasePath: '/api/practice/adaimozhi',
  });

  if (session.isLoading) {
    return <QuestionShell isLoading />;
  }

  if (session.error) {
    return <div>Error: {session.error.message}</div>;
  }

  return (
    <QuestionShell
      questionNumber={session.questionNumber}
      totalQuestions={session.totalQuestions}
    >
      <ProgressIndicator
        current={session.questionNumber}
        total={session.totalQuestions}
      />

      {session.currentQuestion && (
        <AdaimozhiQuestionCard
          question={session.currentQuestion}
          onAnswer={session.submitAnswer}
          showResult={session.showingResult}
          selectedAnswer={session.selectedAnswer}
        />
      )}
    </QuestionShell>
  );
}
```

### AdaimozhiQuestionCard Component (Example)

```typescript
// src/components/adaimozhi/AdaimozhiQuestionCard.tsx
'use client';

import { MCQOptions } from '@/components/practice';
import { TokenizedText } from '@/components/tokenized-text';
import type { AdaimozhiQuestion } from '@/lib/validators/practice/adaimozhi';

interface Props {
  question: AdaimozhiQuestion;
  onAnswer: (option: 'A' | 'B' | 'C' | 'D') => void;
  showResult: boolean;
  selectedAnswer?: string;
}

export function AdaimozhiQuestionCard({
  question,
  onAnswer,
  showResult,
  selectedAnswer,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Phrase with blank */}
      <div className="rounded-lg bg-orange-50 p-6 text-center">
        <p className="font-tamil text-2xl leading-relaxed">
          <TokenizedText text={question.questionText} />
        </p>
      </div>

      {/* Instruction */}
      <p className="text-center text-gray-600">
        கோடிட்ட இடத்தை நிரப்புக (Fill in the blank)
      </p>

      {/* MCQ Options */}
      <MCQOptions
        options={question.options}
        onSelect={onAnswer}
        disabled={showResult}
        selectedOption={selectedAnswer}
        correctOption={showResult ? question.correctOption : undefined}
      />

      {/* Show meaning after answer */}
      {showResult && question.metadata?.meaning_ta && (
        <div className="rounded-lg bg-blue-50 p-4 mt-4">
          <p className="text-sm font-medium text-blue-800">பொருள் (Meaning):</p>
          <p className="font-tamil text-blue-700">{question.metadata.meaning_ta}</p>
          {question.metadata.meaning_en && (
            <p className="mt-1 text-sm text-blue-600">{question.metadata.meaning_en}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Practice API Route (Example)

```typescript
// src/app/api/practice/adaimozhi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AdaimozhiQuestionsQuerySchema } from '@/lib/validators/practice/adaimozhi';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const query = AdaimozhiQuestionsQuerySchema.safeParse({
    limit: searchParams.get('limit'),
    exclude_ids: searchParams.get('exclude_ids'),
  });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: query.error.message } },
      { status: 400 }
    );
  }

  const { limit, exclude_ids } = query.data;
  const excludeArray = exclude_ids?.split(',').filter(Boolean) || [];

  // Fetch published adaimozhi entries
  let queryBuilder = supabase
    .from('adaimozhi')
    .select('*')
    .eq('status', 'published');

  if (excludeArray.length > 0) {
    queryBuilder = queryBuilder.not('id', 'in', `(${excludeArray.join(',')})`);
  }

  const { data: entries, error } = await queryBuilder.limit(limit);

  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  // Build questions with distractors
  const questions = await Promise.all(
    entries.map(async (entry) => {
      const distractors = await getDistractors(supabase, entry.id, entry.missing_word);
      return buildQuestion(entry, distractors);
    })
  );

  return NextResponse.json({
    questions,
    total: questions.length,
    distractorSource: 'database', // or 'ai_fallback' or 'mixed'
  });
}

async function getDistractors(supabase: any, entryId: string, correctWord: string) {
  const { data } = await supabase
    .from('adaimozhi')
    .select('missing_word')
    .neq('id', entryId)
    .neq('missing_word', correctWord)
    .eq('status', 'published')
    .limit(3);

  return data?.map((d: any) => d.missing_word) || [];
}

function buildQuestion(entry: any, distractors: string[]) {
  const allOptions = [
    { text: entry.missing_word, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ];

  // Shuffle
  const shuffled = allOptions.sort(() => Math.random() - 0.5);
  const labels = ['A', 'B', 'C', 'D'] as const;

  return {
    id: entry.id,
    type: 'adaimozhi' as const,
    questionText: entry.phrase_text,
    options: shuffled.map((opt, i) => ({
      label: labels[i],
      text: opt.text,
    })),
    correctOption: labels[shuffled.findIndex((opt) => opt.isCorrect)],
    metadata: {
      complete_phrase: entry.complete_phrase,
      meaning_ta: entry.meaning_ta,
      meaning_en: entry.meaning_en,
    },
  };
}
```

## Testing Commands

```bash
# Run all tests
npm test

# Run adaimozhi tests only
npx playwright test adaimozhi

# Run with UI
npx playwright test adaimozhi --ui
```

## Seed Data (for testing)

```sql
-- Insert sample adaimozhi entries
INSERT INTO adaimozhi (phrase_text, missing_word, complete_phrase, meaning_ta, meaning_en, status, created_by)
VALUES
  ('தாமரை _____', 'கண்கள்', 'தாமரை கண்கள்', 'தாமரை போன்ற அழகிய கண்கள்', 'Beautiful eyes like lotus', 'published', '[teacher-uuid]'),
  ('வெண்ணிலா _____', 'முகம்', 'வெண்ணிலா முகம்', 'நிலவு போன்ற ஒளிரும் முகம்', 'Face glowing like moon', 'published', '[teacher-uuid]'),
  ('தேன் _____', 'மொழி', 'தேன் மொழி', 'தேன் போன்ற இனிமையான மொழி', 'Sweet words like honey', 'published', '[teacher-uuid]'),
  ('மலர் _____', 'கைகள்', 'மலர் கைகள்', 'மலர் போன்ற மென்மையான கைகள்', 'Soft hands like flowers', 'published', '[teacher-uuid]'),
  ('சிங்க _____', 'நடை', 'சிங்க நடை', 'சிங்கம் போன்ற வீரமான நடை', 'Brave walk like a lion', 'published', '[teacher-uuid]');
```

## Verification Checklist

- [ ] Migration applied successfully
- [ ] RLS policies working (test with different roles)
- [ ] Student can see only published entries
- [ ] Teacher can CRUD own entries
- [ ] Distractors come from other DB entries
- [ ] AI fallback works when <3 entries exist
- [ ] CSV import validates and previews correctly
- [ ] E2E tests pass

---

**Ready to implement!** Start with Phase 1 (Database & Validators).
