-- Migration 002: Questions and Passages
-- Creates passages, questions, and question_options tables

-- Create question section enum
CREATE TYPE question_section AS ENUM (
  'vetrumai',
  'seyyul_pazhamozhi',
  'adaimozhi_echcham',
  'comprehension',
  'sorporul',
  'oli_verupaadu'
);

-- Create content status enum
CREATE TYPE content_status AS ENUM ('draft', 'published');

-- Create passages table
CREATE TABLE passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  status content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_passages_status ON passages(status);

ALTER TABLE passages ENABLE ROW LEVEL SECURITY;

-- Create questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section question_section NOT NULL,
  passage_id uuid REFERENCES passages(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  status content_status NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_section ON questions(section);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_section_status ON questions(section, status);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create question_options table
CREATE TABLE question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_label char(1) NOT NULL CHECK (option_label IN ('A', 'B', 'C', 'D')),
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_question_options_question_id ON question_options(question_id);

ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER passages_updated_at
  BEFORE UPDATE ON passages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
