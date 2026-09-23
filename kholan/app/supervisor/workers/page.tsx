'use client';
import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('workers').select('*').then(({ data }) => {
      setWorkers((data as Worker[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Workers</h2>
      </div>
      <div style={{ padding: 28 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Workers</h2>
            <button className="btn-primary" style={{ fontSize: 13 }}>+ Add Worker</button>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
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
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{w.worker_code}</td>
                    <td style={{ fontSize: 13 }}>{w.sector}</td>
                    <td style={{ fontSize: 13 }}>{w.site}</td>
                    <td><StatusBadge status={w.status} /></td>
                    <td>
                      <Link href={`/supervisor/workers/${w.id}`} style={{ color: '#c0392b', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
