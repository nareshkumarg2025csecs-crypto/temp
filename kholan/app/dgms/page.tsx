'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { StatCard, StatusBadge } from '@/components/ui';

interface Certificate {
  id: string;
  cert_hash: string;
  issued_at: string;
  status: string;
  workers?: { name: string };
  modules?: { name: string };
}

interface LogEntry {
  time: string;
  type: 'AUTO' | 'ALERT' | 'MANUAL';
  message: string;
}

const INITIAL_LOG: LogEntry[] = [
  { time: '10:22 AM', type: 'AUTO', message: 'Daily shift report generated.' },
  { time: '09:15 AM', type: 'ALERT', message: 'Gas sensor fault detected at Sector 4. Maintenance team dispatched.' },
  { time: '08:30 AM', type: 'MANUAL', message: 'Supervisor login: DGMS-A492' },
  { time: 'YESTERDAY', type: 'AUTO', message: 'End of day site lockdown sequence completed.' },
];

const LOG_COLOR: Record<string, string> = {
  AUTO: '#6b7280',
  ALERT: '#c0392b',
  MANUAL: '#2563eb',
};

export default function DGMSDashboard() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<{ status: string; site: string }[]>([]);
  const [log, setLog] = useState<LogEntry[]>(INITIAL_LOG);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: certData }, { data: workerData }] = await Promise.all([
      supabase.from('certificates').select('*, workers(name), modules(name)').order('issued_at', { ascending: false }),
      supabase.from('workers').select('status, site'),
    ]);
    setCerts((certData as Certificate[]) ?? []);
    setWorkers((workerData as { status: string; site: string }[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh log every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLog(prev => [
        { time: timeStr, type: 'AUTO', message: 'System heartbeat: All sectors nominal.' },
        ...prev.slice(0, 7),
      ]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleApprove(certId: string) {
    setUpdating(certId);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('certificates')
      .update({ status: 'verified', verified_by: user?.id ?? null })
      .eq('id', certId);

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setLog(prev => [
      { time: now, type: 'MANUAL', message: `Certificate ${certId.slice(0, 8)}... approved by DGMS Official.` },
      ...prev,
    ]);
    await fetchData();
    setUpdating(null);
  }

  async function handleRevoke(certId: string) {
    setUpdating(certId);
    await supabase.from('certificates').update({ status: 'revoked' }).eq('id', certId);
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setLog(prev => [
      { time: now, type: 'ALERT', message: `Certificate ${certId.slice(0, 8)}... REVOKED by DGMS Official.` },
      ...prev,
    ]);
    await fetchData();
    setUpdating(null);
  }

  // Compute stats
  const activeSites = [...new Set(workers.map(w => w.site).filter(Boolean))].length;
  const clearedPersonnel = workers.filter(w => w.status === 'active').length;
  const criticalAlerts = certs.filter(c => c.status === 'revoked').length;
  const verifiedCerts = certs.filter(c => c.status === 'verified' || c.status === 'issued').length;
  const complianceIndex = certs.length ? Math.round((verifiedCerts / certs.length) * 100 * 10) / 10 : 0;

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            placeholder="Search logs, IDs, locations..."
            style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, width: 260, outline: 'none' }}
          />
          <span style={{ fontSize: 18, cursor: 'pointer' }}>🔔</span>
          <span style={{ fontSize: 18, cursor: 'pointer' }}>📍</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>DGMS Supervisor</div>
            <div style={{ fontSize: 11, padding: '2px 8px', background: '#27ae60', color: 'white', borderRadius: 4, fontWeight: 600 }}>
              DGMS OFFICIAL
            </div>
          </div>
          <div style={{
            width: 38, height: 38, background: 'linear-gradient(135deg,#c0392b,#e67e22)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 13,
          }}>DS</div>
        </div>
      </div>

      <div style={{ padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, background: 'linear-gradient(135deg,#c0392b,#e67e22)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>🏛</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>Regional Overview</h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                Official dashboard for monitoring compliance, active personnel, and critical safety alerts across assigned sectors.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#374151', background: '#f3f4f6', padding: '8px 14px', borderRadius: 8 }}>
            📅 Oct 24, 2023 · Live
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard label="Active Sites" value={loading ? '—' : activeSites} sub="↑ +2 from last week" icon="🏭" />
          <StatCard label="Cleared Personnel" value={loading ? '—' : clearedPersonnel.toLocaleString()} sub="— Stable capacity" icon="👷" />
          <StatCard
            label="Critical Alerts"
            value={loading ? '—' : criticalAlerts}
            sub={criticalAlerts > 0 ? '! Requires immediate action' : 'All clear'}
            danger={criticalAlerts > 0}
          />
          <StatCard label="Compliance Index" value={loading ? '—' : `${complianceIndex}%`} sub="↑ Above target" icon="✅" />
        </div>

        {/* Main 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Audit Ledger */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#c0392b', fontSize: 16 }}>⚖</span>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Compliance Audit Ledger</h2>
              </div>
              <input
                placeholder="Search hash or ID..."
                style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, width: 200, outline: 'none' }}
              />
            </div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hash ID / Subject</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certs.map(cert => (
                      <tr key={cert.id}>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
                            {cert.cert_hash?.slice(0, 14)}...
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginTop: 2 }}>
                            {cert.workers?.name} — {cert.modules?.name}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: '#6b7280' }}>
                          {new Date(cert.issued_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td>
                          <StatusBadge status={
                            cert.status === 'pending' ? 'review' :
                            cert.status === 'issued' ? 'verified' :
                            cert.status
                          } />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(cert.status === 'pending' || cert.status === 'review') && (
                              <button
                                onClick={() => handleApprove(cert.id)}
                                disabled={updating === cert.id}
                                className="btn-primary"
                                style={{ fontSize: 12, padding: '6px 14px' }}
                              >
                                {updating === cert.id ? '...' : 'Approve'}
                              </button>
                            )}
                            <a
                              href={`/verify/${cert.id}`}
                              target="_blank"
                              className="btn-secondary"
                              style={{ fontSize: 12, padding: '6px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                            >
                              View
                            </a>
                            {cert.status === 'verified' && (
                              <button
                                onClick={() => handleRevoke(cert.id)}
                                disabled={updating === cert.id}
                                style={{ fontSize: 12, padding: '6px 14px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '12px 20px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Showing 1–{certs.length} of {certs.length} records</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>‹</button>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>›</button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right column: Site map + System Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Site map placeholder */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ⊕ Active Region: Northern Sector
              </div>
              <div style={{
                background: 'linear-gradient(135deg,#0f172a,#1e293b)',
                borderRadius: 8, height: 160, position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Grid lines */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ position: 'absolute', left: `${i * 25}%`, top: 0, bottom: 0, width: 1, background: '#60a5fa' }} />
                  ))}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ position: 'absolute', top: `${i * 25}%`, left: 0, right: 0, height: 1, background: '#60a5fa' }} />
                  ))}
                </div>
                {/* Site markers */}
                {[
                  { x: '30%', y: '40%', color: '#27ae60', label: 'S1' },
                  { x: '60%', y: '55%', color: '#f39c12', label: 'S2' },
                  { x: '75%', y: '30%', color: '#27ae60', label: 'S3' },
                  { x: '20%', y: '70%', color: '#27ae60', label: 'S4' },
                  { x: '50%', y: '20%', color: '#e74c3c', label: '!' },
                ].map((m, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: m.x, top: m.y,
                    transform: 'translate(-50%,-50%)',
                    width: 24, height: 24, borderRadius: '50%',
                    background: m.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700,
                    boxShadow: `0 0 8px ${m.color}66`,
                  }}>{m.label}</div>
                ))}
                <div style={{ fontSize: 11, color: '#94a3b8', zIndex: 2, position: 'relative' }}>
                  — Sector Map (Northern Region) —
                </div>
              </div>
            </div>

            {/* System Log */}
            <div className="card" style={{ padding: 16, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🕐 System Log
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                {log.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                      background: LOG_COLOR[entry.type],
                    }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em' }}>
                        {entry.time} — {entry.type}
                      </div>
                      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{entry.message}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-secondary" style={{ width: '100%', marginTop: 12, fontSize: 12, padding: '7px' }}>
                View Full Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
