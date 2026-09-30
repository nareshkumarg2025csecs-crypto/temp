'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui';

interface Worker {
  id: string;
  name: string;
  worker_code: string;
  sector: string;
  site: string;
  status: string;
}

export default function WorkersListPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [site, setSite] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWorkers = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/supervisor/workers', { headers });
      if (res.ok) {
        const json = await res.json();
        setWorkers(json.workers || []);
        if (json.site) setSite(json.site);
      }
    } catch (e) {
      console.error('Error fetching supervisor workers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Workers Directory</h2>
          {site && (
            <span
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: '#1a1a2e',
              }}
            >
              📍 {site} Jurisdiction
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: 28 }}>
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {site ? `${site} Workers (${workers.length})` : 'Assigned Workers'}
              </h2>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Personnel records under your direct operational oversight.
              </div>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchWorkers();
              }}
              className="btn-secondary"
              style={{ fontSize: 12 }}
            >
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading workers...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Worker Code</th>
                  <th>Sector</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td style={{ color: '#6b7280', fontSize: 13, fontFamily: 'monospace' }}>{w.worker_code}</td>
                    <td style={{ fontSize: 13 }}>{w.sector || '—'}</td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{w.site}</td>
                    <td>
                      <StatusBadge status={w.status} />
                    </td>
                    <td>
                      <Link
                        href={`/supervisor/workers/${w.id}`}
                        style={{ color: '#c0392b', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                      >
                        Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
                {workers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                      No workers registered for {site || 'this site'}.
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
