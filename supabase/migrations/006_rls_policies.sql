-- Migration 006: RLS Policies
-- Row Level Security policies for all tables

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Teachers can read profiles of students in their classes
CREATE POLICY "Teachers read class member profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      JOIN classes c ON cm.class_id = c.id
      WHERE cm.student_id = profiles.id
        AND c.teacher_id = auth.uid()
    )
  );

-- Admins can read all profiles
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all profiles
CREATE POLICY "Admins update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- PASSAGES POLICIES
-- ============================================================================

-- Anyone can read published passages
CREATE POLICY "Anyone reads published passages" ON passages
  FOR SELECT USING (status = 'published');

-- Admins can manage all passages
CREATE POLICY "Admins manage passages" ON passages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- QUESTIONS POLICIES
-- ============================================================================

-- Students read published questions
CREATE POLICY "Students read published questions" ON questions
  FOR SELECT USING (status = 'published');

-- Admins can manage all questions
CREATE POLICY "Admins manage questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- QUESTION_OPTIONS POLICIES
-- ============================================================================

-- Anyone can read options for published questions
CREATE POLICY "Read options for published questions" ON question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_options.question_id
        AND q.status = 'published'
    )
  );

-- Admins can manage all options
CREATE POLICY "Admins manage question options" ON question_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- ATTEMPTS POLICIES
-- ============================================================================

-- Students manage their own attempts
CREATE POLICY "Students manage own attempts" ON attempts
  FOR ALL USING (user_id = auth.uid());

-- Teachers read attempts from their class students
CREATE POLICY "Teachers read class attempts" ON attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      JOIN classes c ON cm.class_id = c.id
      WHERE cm.student_id = attempts.user_id
        AND c.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- ATTEMPT_ANSWERS POLICIES
-- ============================================================================

-- Students manage their own attempt answers
CREATE POLICY "Students manage own answers" ON attempt_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM attempts a
      WHERE a.id = attempt_answers.attempt_id
        AND a.user_id = auth.uid()
    )
  );

-- Teachers read answers from their class students
CREATE POLICY "Teachers read class answers" ON attempt_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attempts a
      JOIN class_members cm ON cm.student_id = a.user_id
      JOIN classes c ON cm.class_id = c.id
      WHERE a.id = attempt_answers.attempt_id
        AND c.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- CLASSES POLICIES
-- ============================================================================

-- Teachers can create classes
CREATE POLICY "Teachers create classes" ON classes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Teachers read their own classes
CREATE POLICY "Teachers read own classes" ON classes
  FOR SELECT USING (teacher_id = auth.uid());

-- Teachers update their own classes
CREATE POLICY "Teachers update own classes" ON classes
  FOR UPDATE USING (teacher_id = auth.uid());

-- Teachers delete their own classes
CREATE POLICY "Teachers delete own classes" ON classes
  FOR DELETE USING (teacher_id = auth.uid());

-- Students read classes they're members of
CREATE POLICY "Students read joined classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = classes.id
        AND cm.student_id = auth.uid()
    )
  );

-- Anyone can read class by join_code (for joining)
CREATE POLICY "Anyone reads class by join code" ON classes
  FOR SELECT USING (true);

-- ============================================================================
-- CLASS_MEMBERS POLICIES
-- ============================================================================

-- Students can join classes
CREATE POLICY "Students join classes" ON class_members
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can leave classes
CREATE POLICY "Students leave classes" ON class_members
  FOR DELETE USING (student_id = auth.uid());

-- Teachers read their class members
CREATE POLICY "Teachers read class members" ON class_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_members.class_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Students read their own memberships
CREATE POLICY "Students read own memberships" ON class_members
  FOR SELECT USING (student_id = auth.uid());

-- ============================================================================
-- ASSIGNMENTS POLICIES
-- ============================================================================

-- Teachers create assignments for their classes
CREATE POLICY "Teachers create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = assignments.class_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Teachers read their class assignments
CREATE POLICY "Teachers read class assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = assignments.class_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Teachers update their class assignments
CREATE POLICY "Teachers update class assignments" ON assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = assignments.class_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Teachers delete their class assignments
CREATE POLICY "Teachers delete class assignments" ON assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = assignments.class_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Students read assignments for their classes
CREATE POLICY "Students read class assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = assignments.class_id
        AND cm.student_id = auth.uid()
    )
  );

-- ============================================================================
-- USER_SAVED_WORDS POLICIES
-- ============================================================================

-- Students manage their own saved words
CREATE POLICY "Students manage own saved words" ON user_saved_words
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- WORD_SENSE_CACHE POLICIES
-- ============================================================================

-- Anyone can read from cache
CREATE POLICY "Anyone reads cache" ON word_sense_cache
  FOR SELECT USING (true);

-- Authenticated users can insert to cache
CREATE POLICY "Authenticated users insert cache" ON word_sense_cache
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
