'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { StatCard, ProgressBar, StatusBadge } from '@/components/ui';

interface Worker {
  id: string;
  name: string;
  worker_code: string;
  site: string;
  status: string;
  certificates: { status: string }[];
  attempts: { status: string; score: number; module_id: string; source: string }[];
  overall_progress_pct?: number;
}

export default function SupervisorDashboard() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [overallProgressMap, setOverallProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [displayName, setDisplayName] = useState('Supervisor');

  useEffect(() => {
    // Set display name from cookie on client only
    const name = decodeURIComponent(
      document.cookie.split('; ').find(r => r.startsWith('kholan_user='))?.split('=')[1] ?? 'Supervisor'
    );
    setDisplayName(name);
  }, []);

  async function fetchData() {
    try {
      const [workersRes, progressRes] = await Promise.all([
        supabase.from('workers').select('*, certificates(*), attempts(*)'),
        supabase.from('worker_overall_progress').select('*'),
      ]);

      const pMap: Record<string, number> = {};
      if (progressRes.data) {
        for (const row of progressRes.data as any[]) {
          pMap[row.worker_id] = Number(row.overall_progress_pct || 0);
        }
      }
      setOverallProgressMap(pMap);
      setWorkers((workersRes.data as Worker[]) ?? []);
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    // Live real-time synchronization on all progress tables
    const channel = supabase
      .channel('supervisor_dashboard_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attempts' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Compute stats
  const totalWorkers = workers.length;
  const allAttempts = workers.flatMap(w => w.attempts ?? []);
  const passedAttempts = allAttempts.filter(a => a.status === 'pass' || a.status === 'passed');
  const passRate = allAttempts.length ? Math.round((passedAttempts.length / allAttempts.length) * 100) : 0;

  const uniqueModulesAttempted = new Set(allAttempts.map(a => a.module_id || '')).size;
  const modulesCompletedPct = uniqueModulesAttempted > 0 ? Math.round((passedAttempts.length / uniqueModulesAttempted) * 100) : 0;

  const pendingRetrains = workers.filter(w =>
    (w.certificates ?? []).some(c => c.status === 'expired')
  ).length;

  const filtered = workers.filter(w =>
    !filter || w.name.toLowerCase().includes(filter.toLowerCase()) ||
    w.site?.toLowerCase().includes(filter.toLowerCase())
  );

  function getWorkerCertStatus(worker: Worker): string {
    const certs = worker.certificates ?? [];
    if (certs.some(c => c.status === 'issued' || c.status === 'verified')) return 'certified';
    if (certs.some(c => c.status === 'expired')) return 'expired';
    return 'pending';
  }

  function getWorkerProgress(worker: Worker): number {
    if (overallProgressMap[worker.id] !== undefined) {
      return overallProgressMap[worker.id];
    }
    const attempts = worker.attempts ?? [];
    if (!attempts.length) return 0;
    const passed = attempts.filter(a => a.status === 'pass' || a.status === 'passed').length;
    return Math.round((passed / Math.max(attempts.length, 1)) * 100);
  }

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#f3f4f6', borderRadius: 8, padding: '6px 14px',
            fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🏭 All Sites (Global) ▾
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 20, cursor: 'pointer' }}>🔔</span>
          <span style={{ fontSize: 20, cursor: 'pointer' }}>📍</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>DGMS Supervisor</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>ID: KH-8892</div>
            </div>
            <div style={{
              width: 36, height: 36, background: 'linear-gradient(135deg, #c0392b, #e67e22)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 14,
            }}>DS</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>
              Operations Overview
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              Real-time safety and compliance metrics.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#27ae60', fontWeight: 600 }}>
            <div className="live-dot" />
            Live System Sync
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard label="Total Workers" value={loading ? '—' : totalWorkers.toLocaleString()} sub="↑ +12 this week" icon="👷" />
          <StatCard label="Modules Completed" value={loading ? '—' : `${modulesCompletedPct}%`} sub="" icon="📋" />
          <StatCard label="Pass Rate" value={loading ? '—' : `${passRate}%`} sub="✓ Target: 90%" icon="🛡" />
          <StatCard
            label="Pending Retrains"
            value={loading ? '—' : pendingRetrains}
            sub={pendingRetrains > 0 ? 'Requires immediate action' : 'All clear'}
            danger={pendingRetrains > 0}
          />
        </div>

        {/* Compliance Log */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Active Worker Compliance Log</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                placeholder="Filter workers..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{
                  padding: '7px 12px', border: '1px solid #e5e7eb',
                  borderRadius: 8, fontSize: 13, outline: 'none', width: 200,
                }}
              />
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                ⚙ Filter
              </button>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                ↓ Export
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading workers...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Worker ID / Name</th>
                  <th>Site Location</th>
                  <th>Module Progress</th>
                  <th>Cert Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(worker => (
                  <tr key={worker.id}>
                    <td>
                      <Link href={`/supervisor/workers/${worker.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: 600, color: '#c0392b', fontSize: 14 }}>{worker.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Code: {worker.worker_code}</div>
                      </Link>
                    </td>
                    <td style={{ color: '#374151', fontSize: 14 }}>{worker.site ?? '—'}</td>
                    <td style={{ minWidth: 160 }}>
                      <ProgressBar value={getWorkerProgress(worker)} />
                    </td>
                    <td>
                      <StatusBadge status={getWorkerCertStatus(worker)} />
                    </td>
                    <td>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>⋮</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                      No workers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
