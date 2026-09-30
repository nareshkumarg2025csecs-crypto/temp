import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthenticatedSupervisor } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const auth = await getAuthenticatedSupervisor(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supervisorSite = auth.site;

  try {
    const { data: workers, error } = await supabaseAdmin
      .from('workers')
      .select('id, name, worker_code, sector, site, clearance_level, status, joined_at')
      .eq('site', supervisorSite)
      .order('joined_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      site: supervisorSite,
      workers: workers || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
