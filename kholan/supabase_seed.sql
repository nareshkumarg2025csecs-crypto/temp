-- ============================================================
-- KHOLAN — Supabase Database Schema (Canonical)
-- Shared with Flutter worker app
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 2. DROP existing tables (safe reset)
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS ar_scenarios CASCADE;
DROP TABLE IF EXISTS mcq_questions CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS course_categories CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 3. TABLES (Canonical Schema)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('supervisor','dgms','worker')),
  official_id   TEXT UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  worker_code     TEXT NOT NULL UNIQUE,
  site            TEXT,
  sector          TEXT,
  clearance_level INT DEFAULT 2,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','inactive')),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  icon          TEXT,
  order_index   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category_id   UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  category      TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  order_index   INT DEFAULT 0,
  type          TEXT,
  title         TEXT,
  video_url     TEXT,
  content       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lesson_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  lesson_id     UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ar_scenarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name          TEXT,
  unity_scene_ref TEXT,
  steps         JSONB,
  order_index   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mcq_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  question      TEXT,
  options       JSONB,
  correct_option INT,
  order_index   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  score         INT NOT NULL,
  status        TEXT CHECK (status IN ('pending','passed','failed','in_progress')),
  attempt_type  TEXT CHECK (attempt_type IN ('initial','retake','final_eval')),
  source        TEXT,
  ar_events     JSONB,
  hash          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certificates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  cert_hash     TEXT,
  qr_code       TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','issued','verified','revoked','expired')),
  issued_at     TIMESTAMPTZ DEFAULT NOW(),
  verified_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_users"              ON users        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_workers"            ON workers      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_course_categories"  ON course_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_modules"            ON modules      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_lessons"            ON lessons      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_lesson_progress"    ON lesson_progress FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_ar_scenarios"       ON ar_scenarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_mcq_questions"      ON mcq_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_attempts"           ON attempts     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_certificates"       ON certificates FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "auth_update_certificates"     ON certificates FOR UPDATE USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- 5. COURSE CATEGORIES
-- ─────────────────────────────────────────────────────────────
INSERT INTO course_categories (id, name, icon, order_index) VALUES
  ('11111111-1000-0000-0000-000000000001', 'Safety & Compliance', '🛡️', 1),
  ('11111111-1000-0000-0000-000000000002', 'Technical Skills', '⚙️', 2),
  ('11111111-1000-0000-0000-000000000003', 'Emergency Response', '🚨', 3);

-- ─────────────────────────────────────────────────────────────
-- 6. MODULES
-- ─────────────────────────────────────────────────────────────
INSERT INTO modules (id, name, category_id, category, description) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Confined Space Entry', '11111111-1000-0000-0000-000000000001', 'Safety & Compliance', 'Safe entry procedures for confined and restricted spaces in mining environments.'),
  ('11111111-0000-0000-0000-000000000002', 'PPE & Procedures', '11111111-1000-0000-0000-000000000001', 'Safety & Compliance', 'Personal protective equipment usage, inspection, and safety procedures.'),
  ('11111111-0000-0000-0000-000000000003', 'Emergency Drills', '11111111-1000-0000-0000-000000000003', 'Emergency Response', 'Emergency evacuation, first aid, and incident response drills.');

-- ─────────────────────────────────────────────────────────────
-- 7. LESSONS (Example structure)
-- ─────────────────────────────────────────────────────────────
INSERT INTO lessons (id, module_id, order_index, type, title, video_url, content) VALUES
  ('22222222-1000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 1, 'video', 'Introduction to Confined Spaces', 'https://example.com/video1.mp4', 'Learn the basics...'),
  ('22222222-1000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 1, 'text', 'PPE Equipment Overview', NULL, 'Types of personal protective equipment...');

-- ─────────────────────────────────────────────────────────────
-- 8. WORKERS
-- ─────────────────────────────────────────────────────────────
INSERT INTO workers (id, name, worker_code, sector, site, status, clearance_level, joined_at) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Ramesh Kumar',  'W-18992',    'Steel Sector',  'Bokaro Steel',  'active',    3, '2021-03-15'),
  ('22222222-0000-0000-0000-000000000002', 'Sunita Devi',   'W-11045',    'Mining Sector', 'Jharia Mine',   'active',    2, '2022-07-01'),
  ('22222222-0000-0000-0000-000000000003', 'Anil Singh',    'W-89881',    'Coal Sector',   'Bokaro Steel',  'suspended', 1, '2020-11-20'),
  ('22222222-0000-0000-0000-000000000004', 'Vikram Patel',  'W-11288',    'Steel Sector',  'Dhanbad Wash',  'active',    4, '2019-06-10'),
  ('22222222-0000-0000-0000-000000000005', 'Rajesh Kumar',  'KH-ST-4092', 'Steel Sector',  'Bokaro Steel',  'active',    3, '2021-10-12'),
  ('22222222-0000-0000-0000-000000000006', 'Priya Sharma',  'W-22401',    'Safety Sector', 'Jharia Mine',   'active',    2, '2023-01-05');

-- ─────────────────────────────────────────────────────────────
-- 9. LESSON PROGRESS (Example)
-- ─────────────────────────────────────────────────────────────
INSERT INTO lesson_progress (id, worker_id, lesson_id, completed_at) VALUES
  ('33333333-2000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '22222222-1000-0000-0000-000000000001', '2023-10-15 14:30:00+05:30'),
  ('33333333-2000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '22222222-1000-0000-0000-000000000001', '2023-10-16 10:15:00+05:30');

-- ─────────────────────────────────────────────────────────────
-- 10. AR SCENARIOS (Example)
-- ─────────────────────────────────────────────────────────────
INSERT INTO ar_scenarios (id, module_id, name, unity_scene_ref, steps, order_index) VALUES
  ('44444444-3000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Entry Procedure Simulation', 'Scene_ConfinedSpaceEntry', '["Step 1: Pre-Entry", "Step 2: Safety Check", "Step 3: Entry"]', 1);

-- ─────────────────────────────────────────────────────────────
-- 11. MCQ QUESTIONS (Example)
-- ─────────────────────────────────────────────────────────────
INSERT INTO mcq_questions (id, module_id, question, options, correct_option, order_index) VALUES
  ('55555555-4000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'What is the first step in confined space entry?', '["Survey the area", "Pre-entry inspection", "Get authorization", "Wear PPE"]', 1, 1),
  ('55555555-4000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Which PPE is mandatory for all workers?', '["Helmet only", "Full PPE kit", "Safety vest", "Gloves only"]', 1, 1);

-- ─────────────────────────────────────────────────────────────
-- 12. ATTEMPTS
-- ─────────────────────────────────────────────────────────────
INSERT INTO attempts (id, worker_id, module_id, attempt_type, score, status, source, hash, created_at) VALUES
  ('66666666-5000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'initial', 65, 'failed', 'web', 'ab8d4cffe1a2b3c4', '2023-10-15 11:00:00+05:30'),
  ('66666666-5000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'retake', 72, 'failed', 'web', 'da6e0bbee2c3d4e5', '2023-10-20 09:15:00+05:30'),
  ('66666666-5000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'final_eval', 94, 'passed', 'mobile', 'f8e1ca33d4e5f6a7', '2023-10-24 14:30:00+05:30'),
  ('66666666-5000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'initial', 88, 'passed', 'web', 'bc12afe4f5a6b7c8', '2023-09-10 10:00:00+05:30'),
  ('66666666-5000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'initial', 79, 'failed', 'mobile', 'cd34bef5a6b7c8d9', '2023-08-05 09:00:00+05:30');

-- ─────────────────────────────────────────────────────────────
-- 13. CERTIFICATES
-- ─────────────────────────────────────────────────────────────
INSERT INTO certificates (id, worker_id, module_id, cert_hash, status, issued_at) VALUES
  ('77777777-6000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'a3f2e1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2', 'issued', '2023-09-15 00:00:00+05:30'),
  ('77777777-6000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'b4e3d2c1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3', 'pending', '2023-08-20 00:00:00+05:30'),
  ('77777777-6000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'c5f4e3d2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4', 'expired', '2022-09-01 00:00:00+05:30'),
  ('77777777-6000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'd6a5b4c3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5', 'verified', '2023-08-05 00:00:00+05:30'),
  ('77777777-6000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'e7b6c5d4f3e2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6', 'pending', '2023-10-24 00:00:00+05:30');

-- ─────────────────────────────────────────────────────────────
-- 14. CREATE AUTH USERS (manual step)
-- ─────────────────────────────────────────────────────────────
-- Go to: Supabase Dashboard > Authentication > Users > Add User
--
--   Email: supervisor@kholan.in   Password: supervisor123
--   Email: dgms@kholan.in         Password: dgms123456
--   Email: worker@kholan.in       Password: worker123456
--
-- Then copy the auto-generated UUIDs and run:
--
-- INSERT INTO users (id, name, role, official_id) VALUES
--   ('<PASTE_SUPERVISOR_UUID>', 'Site Supervisor', 'supervisor', 'supervisor'),
--   ('<PASTE_DGMS_UUID>',       'DGMS Official',   'dgms',       'dgms'),
--   ('<PASTE_WORKER_UUID>',     'Worker',          'worker',     'worker');
--
-- LOGIN CREDENTIALS:
--   Supervisor:  Official ID = supervisor   Token = supervisor123
--   DGMS:        Official ID = dgms         Token = dgms123456
--   Worker:      Official ID = worker       Token = worker123456
-- ─────────────────────────────────────────────────────────────
