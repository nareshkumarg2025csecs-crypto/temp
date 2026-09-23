import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzvepysnmmzznwljvvpe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmVweXNubW16em53bGp2dnBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAyNDc0NywiZXhwIjoyMTAzNjAwNzQ3fQ.6SjJ3OL0VxTC1g9QlrmyqgvUDdpzAAXIE52fCKE47Qw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedLiveDatabase() {
  console.log('Seeding live Supabase database...');

  // 1. Categories
  const categories = [
    { id: '11111111-1000-0000-0000-000000000001', name: 'Safety & Compliance', icon: '🛡️', order_index: 1 },
    { id: '11111111-1000-0000-0000-000000000002', name: 'Technical Skills', icon: '⚙️', order_index: 2 },
    { id: '11111111-1000-0000-0000-000000000003', name: 'Emergency Response', icon: '🚨', order_index: 3 },
  ];

  const { error: catErr } = await supabase.from('course_categories').upsert(categories, { onConflict: 'id' });
  if (catErr) console.error('Category error:', catErr);
  else console.log('✓ Categories seeded.');

  // 2. Modules (only columns present in schema: id, name, category_id, category, description)
  const modules = [
    {
      id: '11111111-0000-0000-0000-000000000004',
      name: 'Fire & Explosion Response',
      category_id: '11111111-1000-0000-0000-000000000003',
      category: 'Emergency Response',
      description: 'Learn to recognize fire hazards, identify emergency exits, and follow correct evacuation sequences.',
    },
    {
      id: '11111111-0000-0000-0000-000000000001',
      name: 'Confined Space Entry',
      category_id: '11111111-1000-0000-0000-000000000001',
      category: 'Safety & Compliance',
      description: 'Safe entry procedures for confined and restricted spaces in mining environments.',
    },
    {
      id: '11111111-0000-0000-0000-000000000002',
      name: 'PPE & Procedures',
      category_id: '11111111-1000-0000-0000-000000000001',
      category: 'Safety & Compliance',
      description: 'Personal protective equipment usage, inspection, and safety verification procedures.',
    },
    {
      id: '11111111-0000-0000-0000-000000000003',
      name: 'Emergency Drills & Evacuation',
      category_id: '11111111-1000-0000-0000-000000000003',
      category: 'Emergency Response',
      description: 'Emergency evacuation, first aid, alarm response, and muster point procedures.',
    },
  ];

  const { error: modErr } = await supabase.from('modules').upsert(modules, { onConflict: 'id' });
  if (modErr) console.error('Modules error:', modErr);
  else console.log('✓ Modules seeded (including 11111111-0000-0000-0000-000000000004).');

  // 3. Lessons
  const lessons = [
    {
      id: '22222222-1000-0000-0000-000000000001',
      module_id: '11111111-0000-0000-0000-000000000004',
      order_index: 1,
      type: 'video',
      title: 'Module 1: Introduction to Fire & Explosion Response',
      video_url: '/videos/module_1.mp4',
      content: 'Welcome to the Fire & Explosion Response training module. Fire and explosions are among the most serious hazards in mining and industrial workplaces. In this module, you will learn how to recognize fire hazards, identify emergency exits, understand fire-extinguisher selection, and follow the correct evacuation sequence.',
    },
    {
      id: '22222222-1000-0000-0000-000000000002',
      module_id: '11111111-0000-0000-0000-000000000004',
      order_index: 2,
      type: 'video',
      title: 'Module 2: Fire Hazards, Exits & Prevention',
      video_url: '/videos/module_2.mp4',
      content: 'Learn to inspect common ignition risks including faulty high-voltage wiring, combustible coal dust buildup, and friction heat. Master the PASS method: Pull the pin, Aim low, Squeeze the trigger, Sweep side-to-side.',
    },
  ];

  const { error: lesErr } = await supabase.from('lessons').upsert(lessons, { onConflict: 'id' });
  if (lesErr) console.error('Lessons error:', lesErr);
  else console.log('✓ Lessons seeded.');

  // 4. AR Scenarios
  const scenarios = [
    {
      id: '44444444-3000-0000-0000-000000000004',
      module_id: '11111111-0000-0000-0000-000000000004',
      name: 'Fire Extinguisher Training',
      unity_scene_ref: 'UAAL_FIRE_EXTINGUISHER',
      steps: ['scan_environment', 'place_ar_scenario', 'find_extinguisher', 'pick_up', 'remove_pin', 'extinguish_fire'],
      order_index: 1,
    },
  ];

  const { error: scErr } = await supabase.from('ar_scenarios').upsert(scenarios, { onConflict: 'id' });
  if (scErr) console.error('Scenario error:', scErr);
  else console.log('✓ AR scenarios seeded.');

  // 5. MCQ Questions (10 items)
  await supabase.from('mcq_questions').delete().eq('module_id', '11111111-0000-0000-0000-000000000004');

  const questions = [
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'What is the fire hazard in this situation?',
      options: ['Fuel kept near the hot machine', 'Safety helmet', 'Clean floor', 'Emergency exit'],
      correct_option: 0,
      order_index: 1,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'You see a damaged electrical wire. What should you do?',
      options: ['Touch the wire', 'Ignore the wire', 'Report the hazard', 'Step over the wire'],
      correct_option: 2,
      order_index: 2,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'You see a fire. What should you do first?',
      options: ['Take your personal bag', 'Raise the alarm', 'Walk closer to the fire', 'Continue working'],
      correct_option: 1,
      order_index: 3,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'Which route should you use to leave during a fire?',
      options: ['Route toward the fire', 'Emergency exit route away from the fire', 'Restricted equipment area', 'Return to the workplace'],
      correct_option: 1,
      order_index: 4,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'Smoke is coming from your work area. What should you do?',
      options: ['Move toward the smoke', 'Stay and watch', 'Move away and follow the safe route', 'Hide near the machine'],
      correct_option: 2,
      order_index: 5,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'The fire is becoming larger and producing heavy smoke. What should you do?',
      options: ['Go closer to the fire', 'Evacuate the dangerous area', 'Stand and watch', 'Return to work'],
      correct_option: 1,
      order_index: 6,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'Which situation creates a higher fire risk?',
      options: ['Flammable materials stored safely', 'Clean work area', 'Combustible waste kept near a heat source', 'Properly stored equipment'],
      correct_option: 2,
      order_index: 7,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'The normal route is blocked by fire. What should you do?',
      options: ['Take the route toward the fire', 'Use the open safe evacuation route', 'Wait beside the fire', 'Go back toward the danger'],
      correct_option: 1,
      order_index: 8,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'You have reached the exit but left your bag inside. What should you do?',
      options: ['Go back for the bag', 'Continue to the safe area', 'Wait near the building', 'Enter through another door'],
      correct_option: 1,
      order_index: 9,
    },
    {
      module_id: '11111111-0000-0000-0000-000000000004',
      question: 'After leaving the danger area, where should you go?',
      options: ['Back inside the building', 'Near the fire', 'Designated assembly point', 'Equipment storage area'],
      correct_option: 2,
      order_index: 10,
    },
  ];

  const { error: qErr } = await supabase.from('mcq_questions').insert(questions);
  if (qErr) console.error('MCQ questions error:', qErr);
  else console.log('✓ 10 MCQ questions seeded for module 11111111-0000-0000-0000-000000000004.');

  console.log('🎉 All live Supabase tables are synchronized and populated!');
}

seedLiveDatabase();
