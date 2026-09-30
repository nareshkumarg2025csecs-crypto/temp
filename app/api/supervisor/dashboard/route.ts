import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthenticatedSupervisor } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const auth = await getAuthenticatedSupervisor(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supervisorSite = auth.site;

  try {
    // 1. Fetch site workers strictly matching the supervisor's authenticated site
    const { data: workersData, error: workersErr } = await supabaseAdmin
      .from('workers')
      .select('id, name, worker_code, sector, site, clearance_level, status, joined_at, certificates(*), attempts(*)')
      .eq('site', supervisorSite)
      .order('joined_at', { ascending: false });

    if (workersErr) {
      console.error('Error fetching workers for site:', workersErr);
      return NextResponse.json({ error: 'Failed to fetch workers data' }, { status: 500 });
    }

    const workers = workersData || [];
    const workerIds = workers.map(w => w.id);

    // 2. Fetch overall progress and modules count in parallel
    const [progressRes, modulesRes] = await Promise.all([
      workerIds.length > 0
        ? supabaseAdmin.from('worker_overall_progress').select('*').in('worker_id', workerIds)
        : Promise.resolve({ data: [] }),
      supabaseAdmin.from('modules').select('id, name')
    ]);

    const overallProgressMap: Record<string, number> = {};
    if (progressRes.data) {
      for (const row of progressRes.data as any[]) {
        overallProgressMap[row.worker_id] = Number(row.overall_progress_pct || 0);
      }
    }

    const totalModulesCount = (modulesRes.data && modulesRes.data.length > 0) ? modulesRes.data.length : 4;

    // 3. Compute accurate site-specific metrics based on actual records
    const totalWorkers = workers.length;

    const allAttempts = workers.flatMap(w => w.attempts ?? []);
    const passedAttempts = allAttempts.filter(a => a.status === 'pass' || a.status === 'passed');
    const passRate = allAttempts.length > 0 ? Math.round((passedAttempts.length / allAttempts.length) * 100) : 0;

    // Modules completed: distinct module assessments passed across workers vs total expected
    const completedModuleAssessments = workers.reduce((sum, w) => {
      const passedModuleIds = new Set(
        (w.attempts ?? [])
          .filter(a => a.status === 'pass' || a.status === 'passed')
          .map(a => a.module_id)
      );
      return sum + passedModuleIds.size;
    }, 0);

    const totalPossibleAssessments = totalWorkers * totalModulesCount;
    const modulesCompletedPct = totalPossibleAssessments > 0
      ? Math.round((completedModuleAssessments / totalPossibleAssessments) * 100)
      : 0;

    // Pending retrains: workers with expired certs, suspended status, or unpassed failed attempts
    const pendingRetrains = workers.filter(w => {
      const hasExpiredCert = (w.certificates ?? []).some(c => c.status === 'expired');
      const isSuspended = w.status === 'suspended';
      const passedModuleIds = new Set(
        (w.attempts ?? [])
          .filter(a => a.status === 'pass' || a.status === 'passed')
          .map(a => a.module_id)
      );
      const hasUnpassedFail = (w.attempts ?? []).some(
        a => (a.status === 'fail' || a.status === 'failed') && !passedModuleIds.has(a.module_id)
      );
      return hasExpiredCert || isSuspended || hasUnpassedFail;
    }).length;

    return NextResponse.json({
      site: supervisorSite,
      supervisorName: auth.name,
      workers,
      overallProgressMap,
      metrics: {
        totalWorkers,
        modulesCompletedPct,
        passRate,
        pendingRetrains,
        completedModuleAssessments,
        totalPossibleAssessments,
        totalAttempts: allAttempts.length,
        passedAttempts: passedAttempts.length
      }
    });
  } catch (err: any) {
    console.error('Supervisor dashboard route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
