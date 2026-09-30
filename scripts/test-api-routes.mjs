import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nzvepysnmmzznwljvvpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmVweXNubW16em53bGp2dnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjQ3NDcsImV4cCI6MjEwMzYwMDc0N30.DzNho7fJO2mlxjCij3Liy6e-8eLPZ6Tobttky0AaSAE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const accounts = [
  { id: 'sup.jharia', email: 'sup.jharia@kholan.in', pass: 'supervisor123', expectedSite: 'Jharia Mine' },
  { id: 'sup.bokaro', email: 'sup.bokaro@kholan.in', pass: 'supervisor123', expectedSite: 'Bokaro Steel' },
  { id: 'sup.dhanbad', email: 'sup.dhanbad@kholan.in', pass: 'supervisor123', expectedSite: 'Dhanbad Wash' },
];

async function testApi() {
  for (const acc of accounts) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });
    if (authError || !authData.session) {
      console.error(`Auth failed for ${acc.id}:`, authError?.message);
      continue;
    }

    const token = authData.session.access_token;

    // Call /api/supervisor/dashboard with Bearer token
    const res = await fetch('http://localhost:3000/api/supervisor/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const json = await res.json();
    console.log(`\n================== API RESULT FOR ${acc.id} ==================`);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Assigned Site: ${json.site}`);
    console.log(`Workers Count: ${json.workers?.length}`);
    console.log(`Worker Names:`, json.workers?.map(w => `${w.name} (${w.site})`));
    console.log(`Metrics:`, json.metrics);
  }

  // Test unauthorized request
  console.log('\n--- TESTING UNAUTHORIZED REQUEST (NO TOKEN) ---');
  const unauthRes = await fetch('http://localhost:3000/api/supervisor/dashboard');
  console.log(`HTTP Status: ${unauthRes.status}`);
  console.log(`Body:`, await unauthRes.json());
}

testApi();
