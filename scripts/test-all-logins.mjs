import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nzvepysnmmzznwljvvpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmVweXNubW16em53bGp2dnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjQ3NDcsImV4cCI6MjEwMzYwMDc0N30.DzNho7fJO2mlxjCij3Liy6e-8eLPZ6Tobttky0AaSAE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const accounts = [
  { id: 'sup.jharia', email: 'sup.jharia@kholan.in', pass: 'supervisor123', expectedSite: 'Jharia Mine' },
  { id: 'sup.bokaro', email: 'sup.bokaro@kholan.in', pass: 'supervisor123', expectedSite: 'Bokaro Steel' },
  { id: 'sup.dhanbad', email: 'sup.dhanbad@kholan.in', pass: 'supervisor123', expectedSite: 'Dhanbad Wash' },
];

async function verify() {
  for (const acc of accounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });
    if (error) {
      console.error(`Login failed for ${acc.id}:`, error.message);
    } else {
      console.log(`✅ Login succeeded for ${acc.id}:`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Site in user_metadata: ${data.user.user_metadata?.site}`);
      console.log(`   Role in user_metadata: ${data.user.user_metadata?.role}`);
    }
  }
}

verify();
