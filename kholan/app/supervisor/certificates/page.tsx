'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui';

interface Certificate {
  id: string;
  cert_hash: string;
  issued_at: string;
  status: string;
  hash: string;
  workers?: { name: string; worker_code: string };
  modules?: { name: string };
}

export default function SupervisorCertificates() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('certificates')
      .select('*, workers(name, worker_code), modules(name)')
      .then(({ data }) => {
        setCerts((data as Certificate[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Certificates</h2>
      </div>
      <div style={{ padding: 28 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Certificates</h2>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hash ID</th>
                  <th>Worker</th>
                  <th>Module</th>
                  <th>Issued At</th>
                  <th>Status</th>
                  <th>Verify</th>
                </tr>
              </thead>
              <tbody>
                {certs.map(cert => (
                  <tr key={cert.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{cert.cert_hash?.slice(0, 14)}...</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{cert.workers?.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{cert.workers?.worker_code}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{cert.modules?.name}</td>
                    <td style={{ fontSize: 13 }}>{new Date(cert.issued_at).toLocaleDateString('en-IN')}</td>
                    <td><StatusBadge status={cert.status} /></td>
                    <td>
                      <a
                        href={`/verify/${cert.id}`}
                        target="_blank"
                        style={{ color: '#c0392b', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                      >
                        Verify →
                      </a>
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
