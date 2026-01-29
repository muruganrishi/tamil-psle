-- Seed data for adaimozhi E2E tests
-- Feature: 003-adaimozhi

-- Note: Replace [teacher-uuid] with actual teacher user UUID
-- This seed assumes test users are already created

-- Insert sample adaimozhi entries for student practice testing
INSERT INTO adaimozhi (phrase_text, missing_word, complete_phrase, meaning_ta, meaning_en, status, created_by)
VALUES
  -- Published entries (available to students)
  ('தாமரை _____', 'கண்கள்', 'தாமரை கண்கள்', 'தாமரை போன்ற அழகிய கண்கள்', 'Beautiful eyes like lotus', 'published', (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)),
  ('வெண்ணிலா _____', 'முகம்', 'வெண்ணிலா முகம்', 'நிலவு போன்ற ஒளிரும் முகம்', 'Face glowing like moon', 'published', (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)),
  ('தேன் _____', 'மொழி', 'தேன் மொழி', 'தேன் போன்ற இனிமையான மொழி', 'Sweet words like honey', 'published', (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)),
  ('மலர் _____', 'கைகள்', 'மலர் கைகள்', 'மலர் போன்ற மென்மையான கைகள்', 'Soft hands like flowers', 'published', (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)),
  ('சிங்க _____', 'நடை', 'சிங்க நடை', 'சிங்கம் போன்ற வீரமான நடை', 'Brave walk like a lion', 'published', (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)),

  -- Draft entries (for teacher testing)
  ('கயல் _____', 'விழி', 'கயல் விழி', 'கயல் மீன் போன்ற அழகிய கண்கள்', 'Eyes like carp fish', 'draft', (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)),
  ('செந்தாமரை _____', 'பாதம்', 'செந்தாமரை பாதம்', 'சிவந்த தாமரை போன்ற பாதங்கள்', 'Feet like red lotus', 'draft', (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Verify seed data
SELECT
  status,
  COUNT(*) as count
FROM adaimozhi
GROUP BY status;
