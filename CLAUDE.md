# TuitionAssistAppFINAL Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-16

## Active Technologies
- Supabase PostgreSQL with RLS (003-adaimozhi)
- Supabase PostgreSQL (existing tables: questions, question_options, user_saved_words, word_sense_cache, user_vocab_reviews) (005-sorporul)

- TypeScript 5.x (strict mode) + Next.js 14+ (App Router), React 18, shadcn/ui, Tailwind CSS, Zod, @supabase/supabase-js, @google/generative-ai (001-tamil-psle-spec)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Recent Changes
- 003-adaimozhi: Added TypeScript 5.x (strict mode) + Next.js 14+ (App Router), React 18, shadcn/ui, Tailwind CSS, Zod, @supabase/supabase-js, @google/generative-ai
- 005-sorporul: Added TypeScript 5.x (strict mode) + Next.js 14+ (App Router), React 18, shadcn/ui, Tailwind CSS, Zod, @supabase/supabase-js, @google/generative-ai

- 001-tamil-psle-spec: Added TypeScript 5.x (strict mode) + Next.js 14+ (App Router), React 18, shadcn/ui, Tailwind CSS, Zod, @supabase/supabase-js, @google/generative-ai

<!-- MANUAL ADDITIONS START -->

## Shared Infrastructure (READ-ONLY)

**These paths are READ-ONLY. Do NOT edit them:**
- `src/types/practice/**`
- `src/lib/validators/practice/**`
- `src/components/practice/**`
- `src/hooks/practice/**`
- `src/hooks/vocab/**`
- `src/hooks/ai/**`
- `src/app/api/vocab/review/**`

## Sync Point Rules

1. **Do NOT edit shared read-only files.** If you need changes to shared infrastructure, STOP and inform the user.

2. **Shared changes require a separate PR:**
   - Create a follow-up PR on `main` for shared-infra changes
   - Rebase your feature branch after the shared PR merges

3. **Merge Batch PRs one-by-one:**
   - Do NOT merge all feature PRs at once
   - Merge one PR → run `npm test` (Playwright) → confirm green → merge next

4. **Before editing any file in the paths above:** STOP and ask the user for guidance.

<!-- MANUAL ADDITIONS END -->
