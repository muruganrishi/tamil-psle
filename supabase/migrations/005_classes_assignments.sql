-- Migration 005: Classes and Assignments
-- Creates classes, class_members, and assignments tables

-- Create classes table
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id),
  name text NOT NULL,
  join_code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_join_code ON classes(join_code);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create class_members table
CREATE TABLE class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT NOW()
);

-- Ensure student can only join a class once
CREATE UNIQUE INDEX idx_class_members_unique ON class_members(class_id, student_id);
CREATE INDEX idx_class_members_class_id ON class_members(class_id);
CREATE INDEX idx_class_members_student_id ON class_members(student_id);

ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- Create assignments table
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  sections question_section[] NOT NULL,
  question_count int NOT NULL CHECK (question_count > 0 AND question_count <= 50),
  max_attempts int NOT NULL DEFAULT 1 CHECK (max_attempts >= 1 AND max_attempts <= 3),
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_class_id ON assignments(class_id);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Add foreign key to attempts table now that assignments exists
ALTER TABLE attempts
  ADD CONSTRAINT fk_attempts_assignment
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL;

-- Helper function to generate join codes
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM classes WHERE join_code = code) INTO exists_check;
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
