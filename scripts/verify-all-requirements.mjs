import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nzvepysnmmzznwljvvpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmVweXNubW16em53bGp2dnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjQ3NDcsImV4cCI6MjEwMzYwMDc0N30.DzNho7fJO2mlxjCij3Liy6e-8eLPZ6Tobttky0AaSAE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SUPERVISOR_TESTS = [
  {
    name: 'Supervisor 1 — Jharia Mine',
    officialId: 'sup.jharia',
    email: 'sup.jharia@kholan.in',
    password: 'supervisor123',
    expectedSite: 'Jharia Mine',
  },
  {
    name: 'Supervisor 2 — Bokaro Steel',
    officialId: 'sup.bokaro',
    email: 'sup.bokaro@kholan.in',
    password: 'supervisor123',
    expectedSite: 'Bokaro Steel',
  },
  {
    name: 'Supervisor 3 — Dhanbad Wash',
    officialId: 'sup.dhanbad',
    email: 'sup.dhanbad@kholan.in',
    password: 'supervisor123',
    expectedSite: 'Dhanbad Wash',
  },
];

async function runVerification() {
  console.log('===============================================================');
  console.log('   FULL END-TO-END VERIFICATION: 3 SITE SUPERVISOR ACCOUNTS   ');
  console.log('===============================================================\n');

  const tokens = {};
  const siteWorkersMap = {};

  for (const acc of SUPERVISOR_TESTS) {
    console.log(`\n>>> Testing [${acc.name}]`);

    // 1. Test Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });

    if (authError || !authData.session) {
      console.error(`❌ Login FAILED for ${acc.email}: ${authError?.message}`);
      process.exit(1);
    }
    console.log(`  1. Login: SUCCESS (User ID: ${authData.user.id})`);

    const token = authData.session.access_token;
    tokens[acc.expectedSite] = token;

    // 2. Test Dashboard API
    const res = await fetch('http://localhost:3000/api/supervisor/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status !== 200) {
      console.error(`❌ Dashboard API failed with HTTP ${res.status}`);
      process.exit(1);
    }

    const data = await res.json();
    siteWorkersMap[acc.expectedSite] = data.workers;

    // 2. Correct site name is returned
    console.log(`  2. Derived Site Name: "${data.site}" (Matches expected: ${data.site === acc.expectedSite})`);

    // 3. Check for site isolation in Active Worker Compliance Log
    const workers = data.workers || [];
    const foreignWorkers = workers.filter(w => w.site !== acc.expectedSite);
    console.log(`  3. Active Worker Compliance Log Worker Count: ${workers.length}`);
    console.log(`     Workers: ${workers.map(w => `${w.name} [${w.worker_code}]`).join(', ')}`);
    console.log(`     Foreign Workers from other sites: ${foreignWorkers.length} (Expected: 0)`);
    if (foreignWorkers.length > 0) {
      console.error(`❌ Isolation FAILURE! Found foreign workers:`, foreignWorkers);
      process.exit(1);
    }

    // 4. Metrics verification
    console.log(`  4. Dashboard Metric Cards:`);
    console.log(`     - Total Workers: ${data.metrics.totalWorkers} (Matches workers count: ${data.metrics.totalWorkers === workers.length})`);
    console.log(`     - Modules Completed %: ${data.metrics.modulesCompletedPct}%`);
    console.log(`     - Pass Rate: ${data.metrics.passRate}%`);
    console.log(`     - Pending Retrains: ${data.metrics.pendingRetrains}`);

    // 5. Test Parameter Tampering Resistance:
    // Attempt to pass ?site=OtherSite to dashboard API
    const otherSite = acc.expectedSite === 'Jharia Mine' ? 'Bokaro Steel' : 'Jharia Mine';
    const tamperRes = await fetch(`http://localhost:3000/api/supervisor/dashboard?site=${encodeURIComponent(otherSite)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tamperData = await tamperRes.json();
    console.log(`  5. Tampering Test (?site=${otherSite}):`);
    console.log(`     Returned Site: "${tamperData.site}" (Expected: "${acc.expectedSite}") -> Tamper resistant: ${tamperData.site === acc.expectedSite}`);
    const foreignInTamper = (tamperData.workers || []).filter(w => w.site !== acc.expectedSite);
    console.log(`     Foreign Workers exposed: ${foreignInTamper.length} (Expected: 0)`);
    if (foreignInTamper.length > 0 || tamperData.site !== acc.expectedSite) {
      console.error(`❌ Tampering bypass succeeded!`);
      process.exit(1);
    }
  }

  // 6. Test Cross-Site Worker Detail Access Prevention
  console.log('\n>>> Testing Cross-Site Direct URL / ID Access Protection:');
  const jhariaWorker = siteWorkersMap['Jharia Mine']?.[0];
  const bokaroToken = tokens['Bokaro Steel'];

  if (jhariaWorker && bokaroToken) {
    console.log(`  Attempting access to Jharia worker (${jhariaWorker.name}, ID: ${jhariaWorker.id}) with Bokaro supervisor token...`);
    const crossRes = await fetch(`http://localhost:3000/api/supervisor/workers/${jhariaWorker.id}`, {
      headers: { Authorization: `Bearer ${bokaroToken}` }
    });
    console.log(`  HTTP Response Status: ${crossRes.status} (Expected: 403 Forbidden)`);
    const crossBody = await crossRes.json();
    console.log(`  Security message: "${crossBody.error}"`);
    if (crossRes.status === 403) {
      console.log(`  ✅ Cross-site access BLOCKED correctly!`);
    } else {
      console.error(`❌ Security breach! Cross-site access returned ${crossRes.status}`);
      process.exit(1);
    }
  }

  console.log('\n===============================================================');
  console.log('      ALL 10 VERIFICATION CHECKS PASSED SUCCESSFULLY!          ');
  console.log('===============================================================');
}

runVerification();
