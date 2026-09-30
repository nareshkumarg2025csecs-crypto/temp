import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nzvepysnmmzznwljvvpe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmVweXNubW16em53bGp2dnBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAyNDc0NywiZXhwIjoyMTAzNjAwNzQ3fQ.6SjJ3OL0VxTC1g9QlrmyqgvUDdpzAAXIE52fCKE47Qw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyze() {
  const { data: sites } = await supabase.from('workers').select('site');
  const distinctSites = [...new Set(sites.map(s => s.site))];

  const { data: totalModules } = await supabase.from('modules').select('id, name');
  console.log(`Total modules available in system: ${totalModules.length}`);
  totalModules.forEach(m => console.log(`  Module: ${m.name} (${m.id})`));

  for (const site of distinctSites) {
    console.log(`\n=================== SITE: ${site} ===================`);
    const { data: workers } = await supabase
      .from('workers')
      .select('id, name, worker_code, site, status, certificates(*), attempts(*)')
      .eq('site', site);

    console.log(`Total Workers: ${workers.length}`);
    workers.forEach(w => {
      console.log(`  Worker: ${w.name} (${w.worker_code})`);
      console.log(`    Attempts: ${w.attempts?.length || 0}`);
      w.attempts?.forEach(a => console.log(`      - Module ${a.module_id}, score: ${a.score}, status: ${a.status}`));
      console.log(`    Certificates: ${w.certificates?.length || 0}`);
      w.certificates?.forEach(c => console.log(`      - Status: ${c.status}`));
    });

    const workerIds = workers.map(w => w.id);
    const { data: overallProg } = await supabase
      .from('worker_overall_progress')
      .select('*')
      .in('worker_id', workerIds);
    console.log(`  Overall progress entries:`, overallProg);

    const { data: lessonProg } = await supabase
      .from('lesson_progress')
      .select('*')
      .in('worker_id', workerIds);
    console.log(`  Lesson progress count: ${lessonProg?.length || 0}`);

    // Compute metrics:
    // 1. Total workers
    const total = workers.length;

    // 2. All attempts for this site's workers
    const allAttempts = workers.flatMap(w => w.attempts ?? []);
    const passedAttempts = allAttempts.filter(a => a.status === 'pass' || a.status === 'passed');
    const passRate = allAttempts.length ? Math.round((passedAttempts.length / allAttempts.length) * 100) : 0;

    // 3. Modules completed
    // Let's examine how modules completed can be defined:
    // Option A: Unique modules passed by workers vs total modules * total workers, or average progress
    // Let's see: how many modules has each worker passed?
    const modulesPassedSet = new Set(passedAttempts.map(a => `${a.worker_id}_${a.module_id}`));
    console.log(`  Distinct worker-module passes: ${modulesPassedSet.size}`);
    
    // Average overall progress percentage across workers:
    const avgProgress = workers.length ? Math.round(
      workers.reduce((acc, w) => {
        const p = overallProg?.find(o => o.worker_id === w.id)?.overall_progress_pct || 0;
        return acc + Number(p);
      }, 0) / workers.length
    ) : 0;
    console.log(`  Average overall progress %: ${avgProgress}%`);

    // 4. Pending retrains:
    // Workers with failed attempts without subsequent pass, or expired certificates, or status 'suspended'/'retrain'
    // Let's check what existing logic had:
    // in app/supervisor/page.tsx:
    // const pendingRetrains = workers.filter(w => (w.certificates ?? []).some(c => c.status === 'expired')).length;
    // Plus failed attempts where the worker hasn't passed that module yet!
    const failedWorkers = workers.filter(w => {
      const wAttempts = w.attempts ?? [];
      const hasFailed = wAttempts.some(a => a.status === 'failed' || a.status === 'fail');
      const hasExpiredCert = (w.certificates ?? []).some(c => c.status === 'expired');
      return hasFailed || hasExpiredCert;
    }).length;
    console.log(`  Pending retrains (expired certs or unpassed failed attempts): ${failedWorkers}`);
  }
}

analyze();
