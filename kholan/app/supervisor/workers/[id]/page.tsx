'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui';

interface Attempt {
  id: string;
  module_id: string;
  attempt_type: string;
  score: number;
  status: string;
  created_at: string;
  hash: string;
  modules?: { name: string };
}

interface Worker {
  id: string;
  name: string;
  worker_code: string;
  sector: string;
  site: string;
  status: string;
  joined_at: string;
  clearance_level: number;
  last_incident: string | null;
  site_access: string;
  current_module: string | null;
  photo_url: string | null;
  attempts: Attempt[];
}

interface ModuleProgress {
  module_id: string;
  module_name: string;
  progress_pct: number;
}

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [moduleProgressList, setModuleProgressList] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchWorkerData() {
    try {
      const [workerRes, overallRes, modulesRes] = await Promise.all([
        supabase
          .from('workers')
          .select('*, attempts(*, modules(name))')
          .eq('id', id)
          .single(),
        supabase
          .from('worker_overall_progress')
          .select('overall_progress_pct')
          .eq('worker_id', id)
          .maybeSingle(),
        supabase
          .from('worker_module_progress_pct')
          .select('*')
          .eq('worker_id', id),
      ]);

      if (workerRes.data) {
        setWorker(workerRes.data as Worker);
      }
      if (overallRes.data?.overall_progress_pct !== undefined) {
        setOverallProgress(Number(overallRes.data.overall_progress_pct));
      }
      if (modulesRes.data) {
        setModuleProgressList(modulesRes.data as ModuleProgress[]);
      }
    } catch (e) {
      console.warn('Worker detail fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkerData();

    // Realtime sync for this worker
    const channel = supabase
      .channel(`worker_detail_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress', filter: `worker_id=eq.${id}` }, () => {
        fetchWorkerData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attempts', filter: `worker_id=eq.${id}` }, () => {
        fetchWorkerData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates', filter: `worker_id=eq.${id}` }, () => {
        fetchWorkerData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading worker data...</div>
  );

  if (!worker) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#c0392b' }}>Worker not found.</div>
  );

  const attempts = [...(worker.attempts ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <nav style={{ fontSize: 13, color: '#9ca3af' }}>
          <Link href="/supervisor/workers" style={{ color: '#9ca3af', textDecoration: 'none' }}>Workers</Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{worker.name}</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#c0392b,#e67e22)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>DS</div>
        </div>
      </div>

      <div style={{ padding: '28px' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Workers › {worker.name}
        </div>

        {/* Name + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>{worker.name}</h1>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6b7280' }}>
              <span>🪪 Code: {worker.worker_code}</span>
              <span>|</span>
              <span>🏭 {worker.sector ?? 'Steel Sector'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary">Suspend</button>
            <button className="btn-primary">Assign Module</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
          {/* Profile Card */}
          <div className="card" style={{ padding: 24 }}>
            {/* Photo + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 12,
                background: worker.photo_url ? `url(${worker.photo_url}) center/cover` : 'linear-gradient(135deg,#374151,#6b7280)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: '#fff',
              }}>
                {!worker.photo_url && '👷'}
              </div>
              <div>
                <StatusBadge status={worker.status ?? 'active'} />
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>⊕ Safety Certified</div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Overall Module Progress</span>
                <span style={{ fontSize: 13, color: '#c0392b', fontWeight: 700 }}>{overallProgress}%</span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: 9999, height: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'linear-gradient(90deg, #c0392b, #27ae60)',
                    height: '100%',
                    width: `${overallProgress}%`,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Details */}
            {[
              ['Joined At', worker.joined_at ? new Date(worker.joined_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'],
              ['Clearance Level', worker.clearance_level ?? 'N/A'],
              ['Last Incident', worker.last_incident ?? 'None (14 mos)'],
              ['Site Access', worker.site_access ?? 'Zones A, B, D'],
              ['Current Module', worker.current_module ?? 'None'],
            ].map(([label, val]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600, textAlign: 'right', maxWidth: 160 }}>{String(val)}</span>
              </div>
            ))}

            {/* Per-Module Progress Breakdown */}
            {moduleProgressList.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                  Module Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {moduleProgressList.map((mp) => (
                    <div key={mp.module_id} style={{ background: '#f9fafb', padding: '8px 10px', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{mp.module_name}</span>
                        <span style={{ fontWeight: 700, color: mp.progress_pct === 100 ? '#27ae60' : '#c0392b' }}>
                          {mp.progress_pct}%
                        </span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                        <div
                          style={{
                            background: mp.progress_pct === 100 ? '#27ae60' : '#c0392b',
                            height: '100%',
                            width: `${mp.progress_pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Module Attempt History */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ color: '#c0392b', fontSize: 18 }}>🔄</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>MODULE ATTEMPT HISTORY</h2>
            </div>

            {attempts.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>No attempts recorded.</p>
            ) : (
              <div className="timeline">
                {attempts.map(attempt => {
                  const isPass = attempt.status === 'pass' || attempt.status === 'passed';
                  return (
                    <div key={attempt.id} className="timeline-item">
                      <div className={`timeline-dot ${isPass ? 'passed' : 'failed'}`} />
                      <div className="card" style={{ padding: '14px 16px', marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                              {formatDate(attempt.created_at)}
                            </div>
                            <div style={{ marginBottom: 6 }}>
                              <StatusBadge status={isPass ? 'passed' : 'failed'} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>
                              {attempt.modules?.name ?? 'Module'} — {attempt.attempt_type}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                              # Hash: {attempt.hash ? attempt.hash.slice(0, 10) + '...' : 'N/A'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: isPass ? '#27ae60' : '#e74c3c' }}>
                              {attempt.score}%
                            </div>
                            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Score</div>
                            {!isPass && (
                              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>(Req: 80%)</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
