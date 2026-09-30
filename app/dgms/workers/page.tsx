'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { StatusBadge, StatCard } from '@/components/ui';

interface Worker {
  id: string;
  name: string;
  worker_code: string;
  sector: string;
  site: string;
  clearance_level: number;
  status: string;
  joined_at: string;
}

export default function DGMSWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');

  const fetchWorkers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching workers for DGMS view:', error);
      } else {
        setWorkers((data as Worker[]) ?? []);
      }
    } catch (err) {
      console.error('Unexpected error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();

    // Subscribe to live changes so newly registered workers appear automatically
    const channel = supabase
      .channel('dgms_workers_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
        fetchWorkers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWorkers]);

  const uniqueSites = [...new Set(workers.map(w => w.site).filter(Boolean))];

  const filteredWorkers = workers.filter(w => {
    const matchesSearch =
      !filter ||
      w.name?.toLowerCase().includes(filter.toLowerCase()) ||
      w.worker_code?.toLowerCase().includes(filter.toLowerCase()) ||
      w.sector?.toLowerCase().includes(filter.toLowerCase()) ||
      w.site?.toLowerCase().includes(filter.toLowerCase());

    const matchesSite = siteFilter === 'all' || w.site === siteFilter;
    return matchesSearch && matchesSite;
  });

  const activeCount = workers.filter(w => w.status === 'active').length;
  const level2Count = workers.filter(w => (w.clearance_level ?? 1) >= 2).length;

  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Personnel Registry — DGMS Official View</h2>
      </div>

      <div style={{ padding: 28 }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>
              Mining & Industrial Workforce Directory
            </h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              Official regulatory oversight of registered personnel across all regional industrial sites and sectors.
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchWorkers(); }}
            className="btn-secondary"
            style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            🔄 Refresh Registry
          </button>
        </div>

        {/* Quick Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Registered" value={loading ? '—' : workers.length} sub="All Jurisdictions" icon="👷" />
          <StatCard label="Active Personnel" value={loading ? '—' : activeCount} sub="Cleared for Operations" icon="✅" />
          <StatCard label="High Clearance (L2+)" value={loading ? '—' : level2Count} sub="Authorized Hazardous Zones" icon="🛡️" />
          <StatCard label="Covered Sites" value={loading ? '—' : uniqueSites.length} sub="Operating Units" icon="🏭" />
        </div>

        {/* Main Workers Table Card */}
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
                All Registered Workers ({filteredWorkers.length})
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Site Filter dropdown */}
              <select
                value={siteFilter}
                onChange={e => setSiteFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                  color: '#374151',
                }}
              >
                <option value="all">All Sites</option>
                {uniqueSites.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Text Search input */}
              <input
                type="text"
                placeholder="Search name, code, sector..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{
                  padding: '7px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 13,
                  width: 240,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              Loading registered personnel records...
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>No personnel found</div>
              <div style={{ fontSize: 13 }}>No workers match your current search or site filter.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Worker Name</th>
                  <th>Worker Code</th>
                  <th>Site</th>
                  <th>Sector</th>
                  <th>Clearance</th>
                  <th>Status</th>
                  <th>Registered On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map(w => (
                  <tr key={w.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{w.name}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          background: '#f3f4f6',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          color: '#374151',
                          fontWeight: 600,
                        }}
                      >
                        {w.worker_code}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#4b5563' }}>{w.site || '—'}</td>
                    <td style={{ fontSize: 13, color: '#4b5563' }}>{w.sector || '—'}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: (w.clearance_level ?? 1) >= 2 ? '#ecfdf5' : '#f3f4f6',
                          color: (w.clearance_level ?? 1) >= 2 ? '#065f46' : '#374151',
                        }}
                      >
                        Level {w.clearance_level ?? 1}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={w.status} />
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {w.joined_at
                        ? new Date(w.joined_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>
                      <Link
                        href={`/supervisor/workers/${w.id}`}
                        style={{
                          color: '#c0392b',
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div
            style={{
              padding: '12px 20px',
              fontSize: 12,
              color: '#9ca3af',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Showing {filteredWorkers.length} of {workers.length} registered personnel</span>
            <span style={{ color: '#27ae60', fontWeight: 600 }}>● Live Supabase Synchronized</span>
          </div>
        </div>
      </div>
    </>
  );
}
