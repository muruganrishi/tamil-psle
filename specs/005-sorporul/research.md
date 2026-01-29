# Research: Sorporul (Word Meanings) Practice

**Feature**: 005-sorporul | **Date**: 2026-01-27

## Research Questions Addressed

### 1. Question Storage Strategy

**Question**: How should sorporul questions be stored given the existing data model?

**Decision**: Use existing `questions` and `question_options` tables with `section='sorporul'`

**Rationale**:
- Existing schema already supports sorporul as a valid section enum value
- `question_text` field stores the Tamil target word (the prompt)
- `question_options` stores 4 Tamil definition options with `is_correct` flag
- No migration needed; fully compatible with existing practice infrastructure

**Alternatives Considered**:
- New `sorporul_questions` table with specialized fields → Rejected: duplicates existing infrastructure, increases complexity
- JSONB metadata field for extra data → Not needed: current schema sufficient

### 2. API Namespace Strategy

**Question**: Where should new APIs live to avoid modifying shared infrastructure?

**Decision**: Use `/api/practice/sorporul/` namespace for all feature-specific APIs

**Rationale**:
- Avoids modifying read-only `/api/questions` endpoint
- Clear separation of concerns (practice vs admin)
- Follows existing patterns (e.g., `/api/admin/*`, `/api/student/*`)
- Teacher question management uses `/api/practice/sorporul/questions`

**Alternatives Considered**:
- `/api/teacher/sorporul/*` → Less clear relationship to practice feature
- Modify `/api/questions` → Violates read-only constraint in CLAUDE.md

### 3. Vocabulary Bank Enhancement

**Question**: Should vocab bank be a new page or enhance existing saved-words page?

**Decision**: Create new `/vocab/` namespace with dedicated pages

**Rationale**:
- `/saved-words` exists but lacks search functionality
- New `/vocab/` namespace provides room for review, statistics
- Cleaner URL structure: `/vocab`, `/vocab/review`
- Uses existing `useVocabBank` hook - no new data layer needed

**Alternatives Considered**:
- Enhance `/saved-words` in place → Could work but limited extensibility
- Combined single page with tabs → More complex, harder to test independently

### 4. AI Distractor Generation Pattern

**Question**: How to integrate Gemini for distractor generation?

**Decision**: New function in `src/lib/gemini/distractors.ts` with structured JSON output

**Rationale**:
- Follows existing `client.ts` pattern in same directory
- Strict JSON schema prevents hallucination/format issues
- Rate limited at API layer (10/min per user) per constitution
- Separate from meaning API to allow different model tuning

**Prompt Design**:
```
You are a Tamil language expert creating MCQ distractors for PSLE students.

Given a Tamil word and its correct definition, generate 3 plausible but INCORRECT
Tamil definitions that:
- Are grammatically similar to the correct definition
- Are plausible enough to challenge students
- Are clearly wrong upon careful reading
- Use vocabulary appropriate for primary school

Word: {target_word}
Correct Definition: {correct_definition}

Respond in this exact JSON format:
{
  "distractors": ["<distractor_1>", "<distractor_2>", "<distractor_3>"]
}

Rules:
- All distractors must be in Tamil
- Do not include the correct definition
- Make distractors similar in length to the correct definition
- Avoid obviously wrong or silly answers
```

**Alternatives Considered**:
- Reuse existing `getContextualMeaning` → Different purpose, different prompt needed
- Free-form text response → Parsing unreliable, JSON schema safer

### 5. CSV Import Validation Strategy

**Question**: How to handle CSV validation with good user feedback?

**Decision**: Two-phase validation with preview step

**Rationale**:
- Phase 1: Parse CSV, validate each row, return preview with per-row errors
- Phase 2: User confirms import after seeing preview
- Allows correction before commit
- Follows existing admin import pattern

**CSV Format**:
```csv
target_word,option_a,option_b,option_c,option_d,correct_answer
இணங்கினான்,மறுத்தான்,சம்மதித்தான்,எதிர்த்தான்,போசித்தான்,B
```

**Validation Rules**:
- All 6 columns required
- `correct_answer` must be A, B, C, or D
- No empty cells
- UTF-8 encoding (Tamil characters)
- Max 1000 rows per import

### 6. Flashcard Review UX

**Question**: What review flow for spaced repetition?

**Decision**: Simple 3-button rating (again/hard/good) with existing SM-2 backend

**Rationale**:
- Existing `/api/vocab/review` already implements SM-2 algorithm
- 3 buttons simpler than Anki's 4 (easy/good/hard/again)
- "easy" rating available but not exposed in MVP UI
- Matches spec requirement exactly

**Flow**:
1. Show Tamil word (definition hidden)
2. User clicks "Show Answer"
3. Reveal Tamil + English definitions + context
4. User rates: Again (1 day) / Hard (slow progress) / Good (normal progress)
5. POST to `/api/vocab/review` with result
6. Show next due word or "All done" message

## Existing Infrastructure Summary

### Read-Only Shared Components (DO NOT MODIFY)

| Component | Location | Purpose |
|-----------|----------|---------|
| `WordGlossaryPopover` | `src/components/practice/WordGlossaryPopover.tsx` | Word meaning popup |
| `SaveWordButton` | `src/components/practice/SaveWordButton.tsx` | Save to vocab bank |
| `MCQOptions` | `src/components/practice/MCQOptions.tsx` | Option rendering |
| `QuestionShell` | `src/components/practice/QuestionShell.tsx` | Question container |
| `usePracticeSession` | `src/hooks/practice/usePracticeSession.ts` | Session management |
| `useVocabBank` | `src/hooks/vocab/useVocabBank.ts` | Vocab operations |

### Read-Only API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/vocab/review` | Spaced repetition review submission |
| `/api/meaning` | Word meaning lookup (Gemini) |
| `/api/saved-words` | Saved words CRUD |
| `/api/questions` | Question fetching (used by practice) |
| `/api/attempts` | Practice attempt submission |

### Database Tables (Existing)

| Table | Used For |
|-------|----------|
| `questions` | Store sorporul questions (section='sorporul') |
| `question_options` | Store Tamil definition options |
| `user_saved_words` | Student's saved vocabulary |
| `word_sense_cache` | Cached word meanings |
| `user_vocab_reviews` | Spaced repetition scheduling |

## Technical Patterns to Follow

### API Route Pattern
```typescript
// From src/app/api/admin/questions/route.ts
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limiting
  const rateLimitResult = checkRateLimit(key, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed) return NextResponse.json(..., { status: 429 });

  // Role check
  const { data: profile } = await supabase.from('profiles').select('role')...
  if (profile?.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Zod validation
  const parseResult = Schema.safeParse(await request.json());
  if (!parseResult.success) return NextResponse.json({ error: ... }, { status: 400 });

  // Business logic...
}
```

### Component Pattern
```typescript
// From existing practice page
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// ... shadcn/ui imports

export default function FeaturePage() {
  const [loading, setLoading] = useState(true);
  // ... state management

  useEffect(() => { /* fetch data */ }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState />;
  return <MainContent />;
}
```

### Gemini Integration Pattern
```typescript
// From src/lib/gemini/client.ts
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const result = await model.generateContent(prompt);
const text = result.response.text().trim();
// Parse JSON response
```
