import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthenticatedSupervisor } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const auth = await getAuthenticatedSupervisor(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supervisorSite = auth.site;

  try {
    // 1. Get worker IDs for supervisor site
    const { data: siteWorkers } = await supabaseAdmin
      .from('workers')
      .select('id')
      .eq('site', supervisorSite);

    const workerIds = (siteWorkers || []).map(w => w.id);
    if (workerIds.length === 0) {
      return NextResponse.json({ site: supervisorSite, certs: [] });
    }

    // 2. Fetch certificates for workers in this site
    const { data: certs, error } = await supabaseAdmin
      .from('certificates')
      .select('*, workers(name, worker_code, site), modules(name)')
      .in('worker_id', workerIds)
      .order('issued_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      site: supervisorSite,
      certs: certs || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
