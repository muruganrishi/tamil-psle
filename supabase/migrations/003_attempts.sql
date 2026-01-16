-- Migration 003: Attempts
-- Creates attempts and attempt_answers tables for tracking practice sessions

-- Create attempts table
CREATE TABLE attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id uuid, -- Will be foreign key after assignments table created
  section question_section NOT NULL,
  started_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz,
  score int CHECK (score >= 0),
  total_questions int NOT NULL CHECK (total_questions > 0)
);

CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_user_section ON attempts(user_id, section);
CREATE INDEX idx_attempts_assignment_id ON attempts(assignment_id);

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Create attempt_answers table
CREATE TABLE attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id),
  selected_option char(1) NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct boolean NOT NULL
);

CREATE INDEX idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);

ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
