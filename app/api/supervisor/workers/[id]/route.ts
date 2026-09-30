import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthenticatedSupervisor } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedSupervisor(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const supervisorSite = auth.site;

  try {
    // 1. Fetch worker
    const { data: worker, error: workerErr } = await supabaseAdmin
      .from('workers')
      .select('*, attempts(*, modules(name)), certificates(*)')
      .eq('id', id)
      .single();

    if (workerErr || !worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // 2. Strict Site Security Check:
    // If user is supervisor and worker site does not match supervisor site -> 403
    if (auth.role === 'supervisor' && worker.site !== supervisorSite) {
      return NextResponse.json(
        {
          error: `Access Denied: Worker belongs to "${worker.site}", but your authorized jurisdiction is "${supervisorSite}".`
        },
        { status: 403 }
      );
    }

    // 3. Fetch progress details
    const [overallRes, modulesRes] = await Promise.all([
      supabaseAdmin
        .from('worker_overall_progress')
        .select('overall_progress_pct')
        .eq('worker_id', id)
        .maybeSingle(),
      supabaseAdmin
        .from('worker_module_progress_pct')
        .select('*')
        .eq('worker_id', id)
    ]);

    return NextResponse.json({
      worker,
      overallProgress: Number(overallRes.data?.overall_progress_pct || 0),
      moduleProgressList: modulesRes.data || []
    });
  } catch (err: any) {
    console.error('Supervisor worker detail route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
