# Parallel Feature Development Guide

This document outlines the conventions for developing the 6 Tamil PSLE practice sections in parallel.

## Shared Infrastructure (READ-ONLY)

The following paths contain shared infrastructure that **MUST NOT be modified** by feature agents. Any changes to shared code must be coordinated through a dedicated PR.

### Read-Only Paths

```
src/types/practice/           # Shared type definitions
src/lib/validators/practice/  # Shared Zod validators
src/components/practice/      # Shared UI components
src/hooks/practice/           # Shared practice hooks
src/hooks/vocab/              # Shared vocab hooks
src/hooks/ai/                 # Shared AI hooks
```

### Read-Only Files

- `src/types/practice/sections.ts` - PracticeSection enum and labels
- `src/types/practice/content.ts` - DTOs for questions, answers, etc.
- `src/lib/validators/practice/common.ts` - Common validation schemas
- `src/lib/validators/practice/student.ts` - Student API schemas
- `src/lib/validators/practice/teacher.ts` - Teacher API schemas
- `src/components/practice/QuestionShell.tsx` - Question container
- `src/components/practice/MCQOptions.tsx` - MCQ selection component
- `src/components/practice/ProgressIndicator.tsx` - Progress display
- `src/components/practice/WordGlossaryPopover.tsx` - Word lookup
- `src/components/practice/SaveWordButton.tsx` - Save to vocab
- `src/hooks/practice/usePracticeSession.ts` - Session management
- `src/hooks/vocab/useVocabBank.ts` - Vocab operations
- `src/hooks/ai/useGeminiCached.ts` - Cached AI calls

## Route Naming Conventions

### Student Routes

```
/practice/[section]           # Main practice page for a section
/practice/[section]/results   # Results after completing practice
```

### API Routes

```
/api/practice/[section]/...   # Section-specific endpoints
/api/practice/sessions        # Shared session management
```

### Feature Agent Route Patterns

Each feature agent owns routes for their specific section:

| Section | Route Prefix | Owner |
|---------|--------------|-------|
| vetrumai | `/practice/vetrumai` | vetrumai-agent |
| pazhamozhi | `/practice/pazhamozhi` | pazhamozhi-agent |
| adaimozhi | `/practice/adaimozhi` | adaimozhi-agent |
| munnunarvu | `/practice/munnunarvu` | munnunarvu-agent |
| sorporul | `/practice/sorporul` | sorporul-agent |
| oli-verupaadu | `/practice/oli-verupaadu` | oli-verupaadu-agent |

## How to Request Shared Changes

If you need changes to shared infrastructure:

1. **Do not modify shared files directly**
2. Create an issue describing the needed change
3. Tag it with `shared-infra` label
4. Wait for the change to be merged to main
5. Rebase your feature branch

## Database Tables

### Shared Tables (READ-ONLY schema)

- `questions` - All practice questions (has `metadata` jsonb)
- `question_options` - MCQ options
- `passages` - Reading passages
- `attempts` - Practice session records
- `attempt_answers` - Individual answers
- `user_saved_words` - Vocabulary bank
- `user_vocab_reviews` - Spaced repetition state
- `ai_generation_cache` - Cached AI responses
- `word_sense_cache` - Cached word meanings

### Writing to Shared Tables

Feature agents CAN write to shared tables (insert questions, record attempts, etc.) but MUST NOT modify the table schema.

## Component Usage

### QuestionShell

```tsx
import { QuestionShell } from '@/components/practice';

<QuestionShell
  questionNumber={1}
  totalQuestions={10}
  questionText={<TokenizedText text={question.questionText} />}
  passage={question.passage}
  navigation={<NavigationButtons />}
>
  <MCQOptions ... />
</QuestionShell>
```

### MCQOptions

```tsx
import { MCQOptions } from '@/components/practice';

<MCQOptions
  options={question.options}
  selectedOption={selected}
  onSelect={handleSelect}
  disabled={isSubmitting}
  reviewMode={showResults}
  correctOption={correctAnswer}
/>
```

### usePracticeSession

```tsx
import { usePracticeSession } from '@/hooks/practice';

const session = usePracticeSession();

// Start session
await session.startSession('vetrumai', { questionCount: 10 });

// Select answer
session.selectAnswer('A');

// Get next question
await session.fetchNextQuestion();

// Submit
await session.submitAnswers();
```

### useVocabBank

```tsx
import { useVocabBank } from '@/hooks/vocab';

const vocab = useVocabBank();

// Save word
await vocab.saveWord({ word, context, meaningEn, meaningTa });

// Load saved words
await vocab.loadWords({ reset: true });

// Get due reviews
await vocab.loadDueReviews(10);

// Submit review
await vocab.submitReview({ word, result: 'good' });
```

## TypeScript Types

### Using PracticeSection

```tsx
import type { PracticeSection } from '@/types/practice';
import { PRACTICE_SECTIONS, SECTION_LABELS_EN } from '@/types/practice';

// Type-safe section handling
function getPracticeLabel(section: PracticeSection): string {
  return SECTION_LABELS_EN[section];
}
```

### Using Validators

```tsx
import { CreateAttemptRequestSchema } from '@/lib/validators/practice';

// In API route
const result = CreateAttemptRequestSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
}
```

## Migration Notes

After pulling latest from main, run:

```bash
# Apply migrations to local Supabase
npx supabase db push

# Or if using hosted Supabase
npx supabase migration up
```

## Questions?

If you have questions about shared infrastructure, check:

1. This document
2. The inline comments in shared files (marked READ-ONLY)
3. Create an issue tagged `question:shared-infra`
