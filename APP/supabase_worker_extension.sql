-- ============================================================
-- KHOLAN — Worker App: Supabase Schema Extension
-- Run this in your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/nzvepysnmmzznwljvvpe/sql)
-- ============================================================

-- 1. Course categories
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,          -- 'Fire Safety', 'Equipment Safety', 'Emergency Procedures', 'Mine Safety'
  icon TEXT,                   -- emoji or icon key
  order_index INT DEFAULT 0
);

-- 2. Link modules to categories
ALTER TABLE modules ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES course_categories(id);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  type TEXT CHECK (type IN ('video', 'text')) NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  content TEXT
);

-- 4. AR scenarios table
CREATE TABLE IF NOT EXISTS ar_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unity_scene_ref TEXT,
  steps JSONB,
  order_index INT DEFAULT 0
);

-- 5. MCQ assessment questions
CREATE TABLE IF NOT EXISTS mcq_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option INT NOT NULL,
  order_index INT DEFAULT 0
);

-- 6. Extend attempts for AR vs MCQ tracking
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('mcq', 'ar')) DEFAULT 'mcq';
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS ar_events JSONB;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS status TEXT;

-- 7. Row Level Security policies
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scenarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_questions     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON course_categories;
CREATE POLICY "public_read_categories" ON course_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_lessons" ON lessons;
CREATE POLICY "public_read_lessons" ON lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_scenarios" ON ar_scenarios;
CREATE POLICY "public_read_scenarios" ON ar_scenarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_questions" ON mcq_questions;
CREATE POLICY "public_read_questions" ON mcq_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_attempts" ON attempts;
CREATE POLICY "public_insert_attempts" ON attempts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_attempts" ON attempts;
CREATE POLICY "public_read_attempts" ON attempts FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_workers" ON workers;
CREATE POLICY "public_read_workers" ON workers FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_modules" ON modules;
CREATE POLICY "public_read_modules" ON modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_certs" ON certificates;
CREATE POLICY "public_read_certs" ON certificates FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_certs" ON certificates;
CREATE POLICY "public_insert_certs" ON certificates FOR INSERT WITH CHECK (true);

-- 8. Seed data for categories
INSERT INTO course_categories (name, icon, order_index) VALUES
  ('Fire Safety', '🔥', 1),
  ('Equipment Safety', '🛠️', 2),
  ('Emergency Procedures', '🚨', 3),
  ('Mine Safety', '⚠️', 4)
ON CONFLICT DO NOTHING;

-- 9. Seed Fire & Explosion Response Module if not present
INSERT INTO modules (id, name, description, pass_threshold, category) VALUES
  ('11111111-0000-0000-0000-000000000004', 'Fire & Explosion Response', 'Learn to recognize fire hazards, identify emergency exits, and follow correct evacuation sequences.', 80, 'Fire Safety')
ON CONFLICT (id) DO UPDATE SET
  category_id = (SELECT id FROM course_categories WHERE name = 'Fire Safety' LIMIT 1),
  description = 'Learn to recognize fire hazards, identify emergency exits, and follow correct evacuation sequences.';

-- Update categories on existing modules
UPDATE modules SET category_id = (SELECT id FROM course_categories WHERE name = 'Mine Safety' LIMIT 1) WHERE name = 'Confined Space Entry';
UPDATE modules SET category_id = (SELECT id FROM course_categories WHERE name = 'Equipment Safety' LIMIT 1) WHERE name = 'PPE & Procedures';
UPDATE modules SET category_id = (SELECT id FROM course_categories WHERE name = 'Emergency Procedures' LIMIT 1) WHERE name = 'Emergency Drills';
UPDATE modules SET category_id = (SELECT id FROM course_categories WHERE name = 'Fire Safety' LIMIT 1) WHERE name = 'Fire & Explosion Response';

-- 10. Seed lessons for Fire & Explosion Response
DELETE FROM lessons WHERE module_id = '11111111-0000-0000-0000-000000000004';
INSERT INTO lessons (module_id, order_index, type, title, video_url, content) VALUES
  ('11111111-0000-0000-0000-000000000004', 1, 'video', 'Introduction to Fire & Explosion Response', '/videos/module_1.mp4', 'Welcome to Fire & Explosion Response. In this lesson, you will learn the core principles of hazard recognition in mining operations.'),
  ('11111111-0000-0000-0000-000000000004', 2, 'video', 'Fire Hazards, Exits & Prevention', '/videos/module_2.mp4', 'Learn the primary fire causes in mine shafts, electrical substations, and the PASS extinguisher technique.');

-- 11. Seed AR scenario for Fire Extinguisher Training
DELETE FROM ar_scenarios WHERE module_id = '11111111-0000-0000-0000-000000000004';
INSERT INTO ar_scenarios (module_id, name, unity_scene_ref, steps, order_index) VALUES
  ('11111111-0000-0000-0000-000000000004', 'Fire Extinguisher Training', 'UAAL_FIRE_EXTINGUISHER',
   '["scan_environment","place_ar_scenario","find_extinguisher","pick_up","remove_pin","extinguish_fire"]'::jsonb, 1);

-- 12. Seed Assessment Questions
DELETE FROM mcq_questions WHERE module_id = '11111111-0000-0000-0000-000000000004';
INSERT INTO mcq_questions (module_id, question, options, correct_option, order_index) VALUES
  ('11111111-0000-0000-0000-000000000004', 'What should you do first if you notice a potential fire hazard?',
   '["Try to fix it yourself without reporting","Move away from immediate danger and raise the alarm","Ignore it if it looks small","Take a photo first for social media"]'::jsonb, 1, 1),
  ('11111111-0000-0000-0000-000000000004', 'What is the correct evacuation sequence in an industrial facility?',
   '["Exit, then raise alarm","Recognize hazard, raise alarm, report, move to safety assembly point","Report after reaching home","Move to safety without telling anyone"]'::jsonb, 1, 2),
  ('11111111-0000-0000-0000-000000000004', 'Which helmet and equipment is required for active underground mining zones?',
   '["Standard Hard Hat with no attachments","Forestry Helmet with wire visor","Mining Helmet with mounted LED lamp and chin strap","Cap with sunglasses"]'::jsonb, 2, 3),
  ('11111111-0000-0000-0000-000000000004', 'What does the PASS technique stand for in fire extinguisher operation?',
   '["Press, Aim, Stop, Save","Pull pin, Aim at base, Squeeze trigger, Sweep side-to-side","Point, Attack, Spray, Stop","Push, Alert, Secure, Step back"]'::jsonb, 1, 4),
  ('11111111-0000-0000-0000-000000000004', 'When must the safety chinstrap of your helmet be secured?',
   '["Only during inspections","At all times while inside active mine and plant zones","Only when riding transport","Never required"]'::jsonb, 1, 5);
