# Quickstart: Sorporul (Word Meanings) Practice

**Feature**: 005-sorporul | **Date**: 2026-01-27

## Developer Onboarding

### Prerequisites

- Node.js 18+
- Access to Supabase project (dev environment)
- Gemini API key in `.env.local`

### Environment Variables

Ensure these are set in `.env.local`:

```bash
# Existing (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

### Quick Setup

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## Feature Overview

### What This Feature Does

1. **Student Practice**: Students select the correct Tamil definition for a given Tamil word (MCQ format)
2. **Vocabulary Bank**: Students save unfamiliar words and review them with flashcards
3. **Teacher Content**: Teachers create questions manually, via CSV, or with AI assistance

### Key Files to Understand

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/practice/sorporul/page.tsx` | Student practice page |
| `src/app/(dashboard)/vocab/page.tsx` | Vocabulary list with search |
| `src/app/(dashboard)/vocab/review/page.tsx` | Flashcard review |
| `src/lib/validators/sorporul.ts` | All Zod schemas |
| `src/lib/gemini/distractors.ts` | AI distractor generation |

### Shared Infrastructure (READ-ONLY)

Do NOT modify these files:

- `src/components/practice/*` - WordGlossaryPopover, SaveWordButton, MCQOptions
- `src/hooks/practice/*` - usePracticeSession
- `src/hooks/vocab/*` - useVocabBank
- `src/app/api/vocab/review/*` - Spaced repetition API

## API Endpoints

### Student APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/practice/sorporul/questions` | GET | Fetch practice questions |
| `/api/attempts` | POST | Submit practice attempt (existing) |
| `/api/saved-words` | GET/POST/DELETE | Vocabulary CRUD (existing) |
| `/api/vocab/review` | GET/POST | Spaced repetition (existing) |

### Teacher APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/practice/sorporul/questions` | POST | Create question |
| `/api/practice/sorporul/questions` | GET | List own questions |
| `/api/practice/sorporul/questions/[id]` | PATCH | Update status |
| `/api/practice/sorporul/import-csv` | POST | CSV import |
| `/api/practice/sorporul/generate-distractors` | POST | AI distractors |

## Development Workflow

### Adding a New Sorporul Question (Manual)

1. Login as teacher
2. Navigate to `/teacher/practice/sorporul/new`
3. Enter target word and correct definition
4. Either enter 3 distractors OR click "Generate Distractors"
5. Click "Save as Draft"
6. Review and click "Publish" to make available

### Testing Student Practice

1. Ensure at least 10 published sorporul questions exist
2. Login as student
3. Navigate to `/practice/sorporul` or click "சொற்பொருள்" from dashboard
4. Complete the practice session
5. View results summary

### Testing Vocabulary Flow

1. During practice, click any Tamil word
2. In the popover, click "Save to vocabulary"
3. Navigate to `/vocab` to see saved words
4. Navigate to `/vocab/review` for flashcard review
5. Rate cards (Again/Hard/Good) to update schedule

## Database Queries

### Get Published Sorporul Questions

```sql
SELECT q.*, array_agg(qo.*) as options
FROM questions q
JOIN question_options qo ON qo.question_id = q.id
WHERE q.section = 'sorporul' AND q.status = 'published'
GROUP BY q.id
LIMIT 10;
```

### Check User's Due Reviews

```sql
SELECT * FROM user_vocab_reviews
WHERE user_id = 'uuid' AND next_review_at <= NOW()
ORDER BY next_review_at ASC
LIMIT 10;
```

## Common Issues

### "No questions available"

- Ensure sorporul questions are published (not just draft)
- Check RLS policies allow student to see published questions

### AI distractor generation fails

- Check GEMINI_API_KEY is set
- Check rate limit not exceeded (10/min per user)
- Gemini may be temporarily unavailable - fallback to manual entry

### Word meaning popover not appearing

- Ensure WordGlossaryPopover is properly integrated
- Check meaning API rate limit (60/min)

## Testing

### Run E2E Tests

```bash
# All tests
npx playwright test

# Just sorporul tests
npx playwright test sorporul.spec.ts
```

### Test Cases

1. `student completes sorporul practice` - Full practice flow
2. `student saves word during practice` - Vocab save integration
3. `student reviews vocab flashcard` - Spaced repetition flow

## Code Style

- Use `'use client'` directive for interactive pages
- Follow existing patterns in `/practice/[section]/page.tsx`
- All API inputs validated with Zod
- Use shadcn/ui components
- Tamil text uses `font-tamil` class
