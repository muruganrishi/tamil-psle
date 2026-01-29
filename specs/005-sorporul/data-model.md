# Data Model: Sorporul (Word Meanings) Practice

**Feature**: 005-sorporul | **Date**: 2026-01-27

## Overview

This feature uses **existing database tables** with no schema changes required. Sorporul questions are stored in the `questions` table with `section='sorporul'`.

## Entity Relationships

```
┌─────────────────┐     ┌───────────────────┐
│    questions    │────<│  question_options │
│ (section=       │     │                   │
│  'sorporul')    │     └───────────────────┘
└─────────────────┘
        │
        │ (answered via)
        ▼
┌─────────────────┐     ┌───────────────────┐
│    attempts     │────<│  attempt_answers  │
└─────────────────┘     └───────────────────┘

┌─────────────────┐     ┌───────────────────┐
│user_saved_words │────<│user_vocab_reviews │
│ (vocabulary)    │     │ (spaced rep)      │
└─────────────────┘     └───────────────────┘
        │
        │ (caches meanings)
        ▼
┌─────────────────┐
│word_sense_cache │
└─────────────────┘
```

## Sorporul Question Structure

### questions table (existing)

| Column | Type | Sorporul Usage |
|--------|------|----------------|
| `id` | uuid | Question identifier |
| `section` | enum | **'sorporul'** |
| `question_text` | text | **Tamil target word** (e.g., "இணங்கினான்") |
| `passage_id` | uuid | NULL (not used for sorporul) |
| `status` | enum | 'draft' or 'published' |
| `created_by` | uuid | Teacher who created |
| `created_at` | timestamp | Creation time |

### question_options table (existing)

| Column | Type | Sorporul Usage |
|--------|------|----------------|
| `id` | uuid | Option identifier |
| `question_id` | uuid | FK to questions |
| `option_label` | char | 'A', 'B', 'C', or 'D' |
| `option_text` | text | **Tamil definition** (e.g., "சம்மதித்தான்") |
| `is_correct` | boolean | TRUE for correct definition |

### Example Sorporul Question

```json
{
  "question": {
    "id": "uuid-1",
    "section": "sorporul",
    "question_text": "இணங்கினான்",
    "passage_id": null,
    "status": "published"
  },
  "options": [
    { "label": "A", "option_text": "மறுத்தான்", "is_correct": false },
    { "label": "B", "option_text": "சம்மதித்தான்", "is_correct": true },
    { "label": "C", "option_text": "எதிர்த்தான்", "is_correct": false },
    { "label": "D", "option_text": "போசித்தான்", "is_correct": false }
  ]
}
```

## Vocabulary Bank Entities (existing)

### user_saved_words

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to profiles (student) |
| `word` | text | Tamil word (normalized) |
| `context` | text | Sentence where word appeared |
| `meaning_en` | text | English definition |
| `meaning_ta` | text | Tamil definition |
| `saved_at` | timestamp | When saved |

**Unique Constraint**: `(user_id, word, context)` - prevents exact duplicates

### user_vocab_reviews (spaced repetition)

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | FK to profiles |
| `word` | text | The word being reviewed |
| `next_review_at` | timestamp | When next due |
| `interval_days` | int | Current interval |
| `ease` | float | SM-2 ease factor (1.3-2.5) |
| `last_result` | enum | 'easy', 'good', 'hard', 'again' |
| `created_at` | timestamp | First review time |

**Unique Constraint**: `(user_id, word)`

### word_sense_cache (meaning cache)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `word_normalized` | text | Normalized Tamil word |
| `context_hash` | text | Hash of context string |
| `language_mode` | enum | 'en', 'ta', 'both' |
| `meaning_en` | text | Cached English meaning |
| `meaning_ta` | text | Cached Tamil meaning |
| `created_at` | timestamp | Cache entry time |

**Unique Constraint**: `(word_normalized, context_hash, language_mode)`

## RLS Policies (existing)

All tables use Row Level Security. Relevant policies:

### questions
- Students: SELECT where `status='published'`
- Teachers: SELECT/INSERT/UPDATE own questions
- Admins: Full access

### question_options
- Via question access (JOIN)

### user_saved_words
- Users: Full access to own rows only (`user_id = auth.uid()`)

### user_vocab_reviews
- Users: Full access to own rows only (`user_id = auth.uid()`)

### word_sense_cache
- All authenticated users: SELECT
- Server-only: INSERT (via API)

## Validation Rules

### Question Creation

| Field | Rule |
|-------|------|
| `question_text` | Required, non-empty, Tamil text |
| `options` | Exactly 4 options |
| `correct_answer` | Exactly one option marked `is_correct=true` |
| `option_text` | Non-empty Tamil text for each |

### CSV Import Row

| Column | Validation |
|--------|------------|
| `target_word` | Required, non-empty |
| `option_a` - `option_d` | Required, non-empty |
| `correct_answer` | Must be 'A', 'B', 'C', or 'D' |

### Vocabulary Save

| Field | Rule |
|-------|------|
| `word` | Required, Tamil text |
| `context` | Required, contains the word |
| `meaning_en` | Optional |
| `meaning_ta` | Optional |

## State Transitions

### Question Lifecycle

```
[Created] → draft → published → (archived - future)
                ↑_____↓
              (unpublish)
```

- Questions start as `draft`
- Teacher publishes to make available to students
- Only `published` questions appear in practice

### Vocab Review Lifecycle

```
[Word Saved] → [First Review Due] → again → [1 day later]
                                  → hard → [interval * 1.2]
                                  → good → [interval * ease]
                                  → easy → [interval * ease * 1.3]
```

SM-2 algorithm parameters:
- MIN_EASE: 1.3
- MAX_EASE: 2.5
- DEFAULT_EASE: 2.5
- AGAIN_INTERVAL: 1 day
