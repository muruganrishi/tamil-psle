# Data Model: TamilPSLE Exam-Prep App

**Branch**: `001-tamil-psle-spec` | **Date**: 2026-01-16 | **Spec**: [spec.md](./spec.md)

---

## Entity-Relationship Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   profiles  │────<│   classes   │────<│  class_members  │
│  (users)    │     │ (teacher's) │     │   (students)    │
└─────────────┘     └─────────────┘     └─────────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  attempts   │     │ assignments │
│ (practice)  │────>│  (tasks)    │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────────┐     ┌─────────────┐     ┌──────────────────┐
│ attempt_answers │────>│  questions  │────>│ question_options │
└─────────────────┘     └─────────────┘     └──────────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  passages   │
                        └─────────────┘

┌──────────────────┐     ┌──────────────────┐
│ user_saved_words │     │ word_sense_cache │
│  (per student)   │     │   (shared)       │
└──────────────────┘     └──────────────────┘
```

---

## Custom Types (Enums)

### user_role
```sql
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
```
- **student**: Default role for all signups. Can practice, join classes, save words.
- **teacher**: Can create classes, assignments, view student progress. Granted by admin.
- **admin**: Full system access. Manages content, users, and system configuration.

### question_section
```sql
CREATE TYPE question_section AS ENUM (
  'vetrumai',           -- A1 வேற்றுமை (Case markers)
  'seyyul_pazhamozhi',  -- A2 செய்யுள்/பழமொழி (Poetry/Proverbs)
  'adaimozhi_echcham',  -- A3 அடைமொழி/எச்சம் (Adjectives/Participles)
  'comprehension',      -- A4 முன்னுணர்வுக் கருத்தறிதல்
  'sorporul',           -- சொற்பொருள் (Word meanings)
  'oli_verupaadu'       -- ஒலி வேறுபாடு (Sound differentiation)
);
```

### content_status
```sql
CREATE TYPE content_status AS ENUM ('draft', 'published');
```
- **draft**: Visible only to creator and admins. Not available for student practice.
- **published**: Available for student practice sessions.

### language_mode
```sql
CREATE TYPE language_mode AS ENUM ('en', 'ta', 'both');
```
- **en**: English meanings only
- **ta**: Tamil meanings only
- **both**: Both English and Tamil meanings (default)

---

## Entity Definitions

### profiles

**Purpose**: Extended user information linked to Supabase Auth.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK → auth.users | User's auth ID |
| role | user_role | NOT NULL, DEFAULT 'student' | Access level |
| display_name | text | NULL | Optional display name |
| ui_language | language_mode | NOT NULL, DEFAULT 'both' | Meaning display preference |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | Account creation |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() | Last profile update |

**Indexes**: `role`

**Trigger**: Auto-create profile on auth.users insert

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### classes

**Purpose**: Teacher-created groups for organizing students and assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Class ID |
| teacher_id | uuid | FK → profiles, NOT NULL | Owning teacher |
| name | text | NOT NULL | Class name |
| join_code | text | UNIQUE, NOT NULL | 6-char alphanumeric code |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes**: `teacher_id`, `join_code`

**Join Code Generation**:
```sql
-- Generate random 6-char alphanumeric code
SELECT upper(substr(md5(random()::text), 1, 6));
```

---

### class_members

**Purpose**: Many-to-many relationship between classes and student members.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Membership ID |
| class_id | uuid | FK → classes, NOT NULL | Class reference |
| student_id | uuid | FK → profiles, NOT NULL | Student reference |
| joined_at | timestamptz | NOT NULL, DEFAULT NOW() | Join timestamp |

**Constraints**: UNIQUE (class_id, student_id)

**Indexes**: `class_id`, `student_id`

---

### passages

**Purpose**: Tamil text passages for comprehension questions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Passage ID |
| title | text | NOT NULL | Passage title/identifier |
| content | text | NOT NULL | Tamil passage text |
| created_by | uuid | FK → profiles, NOT NULL | Creator (admin/teacher) |
| status | content_status | NOT NULL, DEFAULT 'draft' | Publication status |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | Creation time |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**: `status`

---

### questions

**Purpose**: MCQ questions organized by section.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Question ID |
| section | question_section | NOT NULL | Question category |
| passage_id | uuid | FK → passages, NULL | Linked passage (comprehension) |
| question_text | text | NOT NULL | Tamil question text |
| status | content_status | NOT NULL, DEFAULT 'draft' | Publication status |
| created_by | uuid | FK → profiles, NOT NULL | Creator |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | Creation time |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**: `section`, `status`, `(section, status)`

---

### question_options

**Purpose**: The 4 answer options for each MCQ.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Option ID |
| question_id | uuid | FK → questions, NOT NULL, ON DELETE CASCADE | Parent question |
| option_label | char(1) | NOT NULL, CHECK (option_label IN ('A','B','C','D')) | A, B, C, or D |
| option_text | text | NOT NULL | Tamil option text |
| is_correct | boolean | NOT NULL, DEFAULT FALSE | Correct answer flag |

**Indexes**: `question_id`

**Constraint**: Exactly one option per question should have `is_correct = TRUE`

---

### attempts

**Purpose**: Records a student's practice session.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Attempt ID |
| user_id | uuid | FK → profiles, NOT NULL | Student |
| assignment_id | uuid | FK → assignments, NULL | Assignment context (if any) |
| section | question_section | NOT NULL | Practice section |
| started_at | timestamptz | NOT NULL, DEFAULT NOW() | Session start |
| completed_at | timestamptz | NULL | Session end |
| score | int | NULL, CHECK (score >= 0) | Correct answers |
| total_questions | int | NOT NULL, CHECK (total_questions > 0) | Questions in session |

**Indexes**: `user_id`, `(user_id, section)`, `assignment_id`

---

### attempt_answers

**Purpose**: Individual question responses within an attempt.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Answer ID |
| attempt_id | uuid | FK → attempts, NOT NULL, ON DELETE CASCADE | Parent attempt |
| question_id | uuid | FK → questions, NOT NULL | Answered question |
| selected_option | char(1) | NOT NULL, CHECK (selected_option IN ('A','B','C','D')) | Student's choice |
| is_correct | boolean | NOT NULL | Computed: matches correct option |

**Indexes**: `attempt_id`

---

### assignments

**Purpose**: Teacher-created practice tasks for a class.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Assignment ID |
| class_id | uuid | FK → classes, NOT NULL | Target class |
| created_by | uuid | FK → profiles, NOT NULL | Teacher creator |
| title | text | NOT NULL | Assignment name |
| sections | question_section[] | NOT NULL | Array of sections |
| question_count | int | NOT NULL, CHECK (question_count > 0 AND question_count <= 50) | Questions to include |
| max_attempts | int | NOT NULL, DEFAULT 1, CHECK (max_attempts >= 1 AND max_attempts <= 3) | Allowed retries |
| due_date | timestamptz | NULL | Optional deadline |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes**: `class_id`

---

### user_saved_words

**Purpose**: Student's personal vocabulary list.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Saved word ID |
| user_id | uuid | FK → profiles, NOT NULL | Owner student |
| word | text | NOT NULL | Normalized Tamil word |
| context | text | NOT NULL | Surrounding text |
| meaning_en | text | NULL | English definition |
| meaning_ta | text | NULL | Tamil definition |
| saved_at | timestamptz | NOT NULL, DEFAULT NOW() | Save timestamp |

**Constraints**: UNIQUE (user_id, word, context)

**Indexes**: `user_id`

---

### word_sense_cache

**Purpose**: Shared cache of AI-generated word meanings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Cache entry ID |
| word_normalized | text | NOT NULL | Normalized Tamil word |
| context_hash | text | NOT NULL | MD5 hash of context window |
| language_mode | language_mode | NOT NULL | Request language setting |
| meaning_en | text | NULL | Cached English meaning |
| meaning_ta | text | NULL | Cached Tamil meaning |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | Cache time |

**Constraints**: UNIQUE (word_normalized, context_hash, language_mode)

**Indexes**: `(word_normalized, context_hash, language_mode)`

---

## RLS Policies Summary

### profiles
```sql
-- Students read own profile
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Teachers read class members
CREATE POLICY "Teachers read class member profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      JOIN classes c ON cm.class_id = c.id
      WHERE cm.student_id = profiles.id
        AND c.teacher_id = auth.uid()
    )
  );

-- Admins read all
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### questions
```sql
-- Students read published questions
CREATE POLICY "Students read published questions" ON questions
  FOR SELECT USING (status = 'published');

-- Admins full access
CREATE POLICY "Admins manage questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### attempts
```sql
-- Students manage own attempts
CREATE POLICY "Students manage own attempts" ON attempts
  FOR ALL USING (user_id = auth.uid());

-- Teachers read class student attempts
CREATE POLICY "Teachers read class attempts" ON attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      JOIN classes c ON cm.class_id = c.id
      WHERE cm.student_id = attempts.user_id
        AND c.teacher_id = auth.uid()
    )
  );
```

*See spec.md Section 6 for complete RLS matrix.*

---

## Migration Files

| Migration | Description |
|-----------|-------------|
| `001_profiles.sql` | Types, profiles table, auth trigger |
| `002_questions_passages.sql` | Passages, questions, options tables |
| `003_attempts.sql` | Attempts, attempt_answers tables |
| `004_word_cache.sql` | word_sense_cache, user_saved_words tables |
| `005_classes_assignments.sql` | Classes, class_members, assignments tables |
| `006_rls_policies.sql` | All RLS policies |

---

**Data Model Status**: Complete | **Last Updated**: 2026-01-16
