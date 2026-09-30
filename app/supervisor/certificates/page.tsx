'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui';

interface Certificate {
  id: string;
  cert_hash: string;
  issued_at: string;
  status: string;
  hash: string;
  workers?: { name: string; worker_code: string; site?: string };
  modules?: { name: string };
}

export default function SupervisorCertificates() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [site, setSite] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCerts = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/supervisor/certificates', { headers });
      if (res.ok) {
        const json = await res.json();
        setCerts(json.certs || []);
        if (json.site) setSite(json.site);
      }
    } catch (e) {
      console.error('Error fetching certificates:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Certificates Ledger</h2>
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
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {site ? `${site} Issued Certificates` : 'Certificates'}
            </h2>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              Verified compliance and qualification credentials for personnel under your oversight.
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading certificates...</div>
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
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
                      {cert.cert_hash?.slice(0, 14)}...
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{cert.workers?.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{cert.workers?.worker_code}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{cert.modules?.name}</td>
                    <td style={{ fontSize: 13 }}>{new Date(cert.issued_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <StatusBadge status={cert.status} />
                    </td>
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
                {certs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                      No certificates issued yet for {site || 'this site'}.
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
