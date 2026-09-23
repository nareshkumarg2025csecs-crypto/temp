import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzvepysnmmzznwljvvpe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmVweXNubW16em53bGp2dnBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAyNDc0NywiZXhwIjoyMTAzNjAwNzQ3fQ.6SjJ3OL0VxTC1g9QlrmyqgvUDdpzAAXIE52fCKE47Qw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testInsertAttempt() {
  console.log('Testing attempts insert with Fire Module...');
  const { data: workers } = await supabase.from('workers').select('id').limit(1);
  const workerId = workers?.[0]?.id || '22222222-0000-0000-0000-000000000001';

  // Test lesson_progress insert
  const { data: lpData, error: lpError } = await supabase
    .from('lesson_progress')
    .upsert({
      worker_id: workerId,
      lesson_id: '22222222-1000-0000-0000-000000000001',
    }, { onConflict: 'worker_id,lesson_id' })
    .select();

  console.log('Lesson progress result:', { success: !lpError, error: lpError?.message });

  // Test attempts insert
  const { data: attData, error: attError } = await supabase
    .from('attempts')
    .insert({
      worker_id: workerId,
      module_id: '11111111-0000-0000-0000-000000000004',
      score: 100,
      status: 'pass',
      attempt_type: 'initial',
      source: 'ar',
      ar_events: { manual_completion: true },
      hash: 'test-' + Date.now(),
    })
    .select();

  console.log('Attempts insert result:', { success: !attError, error: attError?.message });
}

testInsertAttempt();
