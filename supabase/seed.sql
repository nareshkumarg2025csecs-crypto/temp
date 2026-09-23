-- ─────────────────────────────────────────────────────────────
-- CANONICAL SEED DATA FOR KHOLAN
-- Run this in Supabase SQL Editor AFTER running schema.sql
-- ─────────────────────────────────────────────────────────────

-- 1. COURSE CATEGORIES
INSERT INTO course_categories (id, name, icon, order_index) VALUES
  ('11111111-1000-0000-0000-000000000001', 'Safety & Compliance', '🛡️', 1),
  ('11111111-1000-0000-0000-000000000002', 'Technical Skills', '⚙️', 2),
  ('11111111-1000-0000-0000-000000000003', 'Emergency Response', '🚨', 3)
ON CONFLICT (id) DO NOTHING;

-- 2. MODULES
INSERT INTO modules (id, name, category_id, category, description) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Confined Space Entry', '11111111-1000-0000-0000-000000000001', 'Safety & Compliance', 'Safe entry procedures for confined and restricted spaces in mining environments.'),
  ('11111111-0000-0000-0000-000000000002', 'PPE & Procedures', '11111111-1000-0000-0000-000000000001', 'Safety & Compliance', 'Personal protective equipment usage, inspection, and safety procedures.'),
  ('11111111-0000-0000-0000-000000000003', 'Emergency Drills', '11111111-1000-0000-0000-000000000003', 'Emergency Response', 'Emergency evacuation, first aid, and incident response drills.')
ON CONFLICT (id) DO NOTHING;

-- 3. LESSONS
INSERT INTO lessons (id, module_id, order_index, type, title, video_url, content) VALUES
  ('22222222-1000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 1, 'video', 'Introduction to Confined Spaces', 'https://example.com/video1.mp4', 'Learn the essential hazard identification and pre-entry atmospheric checks.'),
  ('22222222-1000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 1, 'text', 'PPE Equipment Overview', NULL, 'Types of personal protective equipment, maintenance standards, and daily checks.')
ON CONFLICT (id) DO NOTHING;

-- 4. AR SCENARIOS
INSERT INTO ar_scenarios (id, module_id, name, unity_scene_ref, steps, order_index) VALUES
  ('44444444-3000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Entry Procedure Simulation', 'Scene_ConfinedSpaceEntry', '["Step 1: Pre-Entry Atmospheric Test", "Step 2: Harness & Lockout Check", "Step 3: Safe Ventilation & Entry"]', 1)
ON CONFLICT (id) DO NOTHING;

-- 5. MCQ QUESTIONS (10-Question Standard Set)
INSERT INTO mcq_questions (id, module_id, question, options, correct_option, order_index) VALUES
  ('55555555-4000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'What is the fire hazard in this situation?', '["Fuel kept near the hot machine", "Safety helmet", "Clean floor", "Emergency exit"]'::jsonb, 0, 1),
  ('55555555-4000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', 'You see a damaged electrical wire. What should you do?', '["Touch the wire", "Ignore the wire", "Report the hazard", "Step over the wire"]'::jsonb, 2, 2),
  ('55555555-4000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004', 'You see a fire. What should you do first?', '["Take your personal bag", "Raise the alarm", "Walk closer to the fire", "Continue working"]'::jsonb, 1, 3),
  ('55555555-4000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004', 'Which route should you use to leave during a fire?', '["Route toward the fire", "Emergency exit route away from the fire", "Restricted equipment area", "Return to the workplace"]'::jsonb, 1, 4),
  ('55555555-4000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000004', 'Smoke is coming from your work area. What should you do?', '["Move toward the smoke", "Stay and watch", "Move away and follow the safe route", "Hide near the machine"]'::jsonb, 2, 5),
  ('55555555-4000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000004', 'The fire is becoming larger and producing heavy smoke. What should you do?', '["Go closer to the fire", "Evacuate the dangerous area", "Stand and watch", "Return to work"]'::jsonb, 1, 6),
  ('55555555-4000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000004', 'Which situation creates a higher fire risk?', '["Flammable materials stored safely", "Clean work area", "Combustible waste kept near a heat source", "Properly stored equipment"]'::jsonb, 2, 7),
  ('55555555-4000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000004', 'The normal route is blocked by fire. What should you do?', '["Take the route toward the fire", "Use the open safe evacuation route", "Wait beside the fire", "Go back toward the danger"]'::jsonb, 1, 8),
  ('55555555-4000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000004', 'You have reached the exit but left your bag inside. What should you do?', '["Go back for the bag", "Continue to the safe area", "Wait near the building", "Enter through another door"]'::jsonb, 1, 9),
  ('55555555-4000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000004', 'After leaving the danger area, where should you go?', '["Back inside the building", "Near the fire", "Designated assembly point", "Equipment storage area"]'::jsonb, 2, 10),
  ('55555555-4000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', 'What is the mandatory first step before entering any confined space?', '["Begin work immediately", "Perform atmospheric gas testing", "Turn off ventilation", "Remove helmet"]'::jsonb, 1, 1),
  ('55555555-4000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000002', 'Which PPE is mandatory in active mining & shaft zones?', '["High-visibility vest & hard hat", "Casual footwear", "Sunglasses only", "Standard earphones"]'::jsonb, 0, 1)
ON CONFLICT (id) DO NOTHING;

-- 6. SAMPLE WORKERS
INSERT INTO workers (id, name, worker_code, sector, site, status, clearance_level, joined_at) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Ramesh Kumar',  'W-18992',    'Steel Sector',  'Bokaro Steel',  'active',    3, '2021-03-15T00:00:00Z'),
  ('22222222-0000-0000-0000-000000000002', 'Sunita Devi',   'W-11045',    'Mining Sector', 'Jharia Mine',   'active',    2, '2022-07-01T00:00:00Z'),
  ('22222222-0000-0000-0000-000000000003', 'Anil Singh',    'W-89881',    'Coal Sector',   'Bokaro Steel',  'suspended', 1, '2020-11-20T00:00:00Z'),
  ('22222222-0000-0000-0000-000000000004', 'Vikram Patel',  'W-11288',    'Steel Sector',  'Dhanbad Wash',  'active',    4, '2019-06-10T00:00:00Z'),
  ('22222222-0000-0000-0000-000000000005', 'Rajesh Kumar',  'KH-ST-4092', 'Steel Sector',  'Bokaro Steel',  'active',    3, '2021-10-12T00:00:00Z'),
  ('22222222-0000-0000-0000-000000000006', 'Priya Sharma',  'W-22401',    'Safety Sector', 'Jharia Mine',   'active',    2, '2023-01-05T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 7. SAMPLE ATTEMPTS
INSERT INTO attempts (id, worker_id, module_id, attempt_type, score, status, source, hash, created_at) VALUES
  ('66666666-5000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'initial', 65, 'fail', 'web', 'ab8d4cffe1a2b3c4', '2023-10-15T11:00:00Z'),
  ('66666666-5000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'retake', 72, 'fail', 'web', 'da6e0bbee2c3d4e5', '2023-10-20T09:15:00Z'),
  ('66666666-5000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'final', 94, 'pass', 'mobile', 'f8e1ca33d4e5f6a7', '2023-10-24T14:30:00Z'),
  ('66666666-5000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'initial', 88, 'pass', 'web', 'bc12afe4f5a6b7c8', '2023-09-10T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 8. SAMPLE CERTIFICATES
INSERT INTO certificates (id, worker_id, module_id, cert_hash, status, issued_at) VALUES
  ('77777777-6000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'a3f2e1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2', 'issued', '2023-09-15T00:00:00Z'),
  ('77777777-6000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'b4e3d2c1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3', 'pending', '2023-08-20T00:00:00Z'),
  ('77777777-6000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'c5f4e3d2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4', 'expired', '2022-09-01T00:00:00Z'),
  ('77777777-6000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'd6a5b4c3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5', 'verified', '2023-08-05T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
