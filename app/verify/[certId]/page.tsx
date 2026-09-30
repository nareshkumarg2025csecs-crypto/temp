'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface CertData {
  id: string;
  cert_hash: string;
  issued_at: string;
  status: string;
  workers?: { name: string; worker_code: string };
  modules?: { name: string };
  attempts?: { score: number; status: string }[];
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function VerifyPage() {
  const { certId } = useParams<{ certId: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hashValid, setHashValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchAndVerify() {
      const { data } = await supabase
        .from('certificates')
        .select('*, workers(name, worker_code), modules(name), attempts(score, status)')
        .eq('id', certId)
        .single();

      if (!data) { setLoading(false); return; }
      const c = data as CertData;
      setCert(c);

      // Recompute SHA-256 of core fields
      const score = (c.attempts ?? [])[0]?.score ?? 0;
      const payload = `${c.id}|${c.workers?.worker_code}|${c.modules?.name}|${score}|${c.issued_at}`;
      const recomputed = await sha256(payload);
      setHashValid(recomputed === c.cert_hash);
      setLoading(false);
    }
    fetchAndVerify();
  }, [certId]);

  const score = (cert?.attempts ?? [])[0]?.score ?? 0;

  return (
    <div style={{
      minHeight: '100vh', background: '#f4f5f7',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Image src="/logo-icon.png" alt="Kholan" width={40} height={40} style={{ objectFit: 'contain' }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>KHOLAN</div>
          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Certificate Verification Portal</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, color: '#6b7280', fontSize: 16 }}>Verifying certificate...</div>
      ) : !cert ? (
        <div style={{
          background: 'white', borderRadius: 16, padding: 48, textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: 480, width: '100%',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#c0392b', margin: '0 0 8px' }}>Certificate Not Found</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            No certificate exists for ID: <code>{certId}</code>
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 16, padding: 40,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          maxWidth: 520, width: '100%',
          border: hashValid
            ? '2px solid #27ae60'
            : hashValid === false
            ? '2px solid #e74c3c'
            : '2px solid #e5e7eb',
        }}>
          {/* Verification badge */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>
              {hashValid === null ? '⏳' : hashValid ? '✅' : '❌'}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 24,
              background: hashValid ? '#d1fae5' : hashValid === false ? '#fee2e2' : '#f3f4f6',
              color: hashValid ? '#065f46' : hashValid === false ? '#991b1b' : '#6b7280',
              fontWeight: 700, fontSize: 16,
            }}>
              {hashValid === null ? 'Checking...' : hashValid ? '✓ VERIFIED' : '✗ INVALID — Hash Mismatch'}
            </div>
            {hashValid && cert.status === 'revoked' && (
              <div style={{ marginTop: 8, color: '#c0392b', fontWeight: 600, fontSize: 13 }}>
                ⚠ Note: This certificate has been REVOKED.
              </div>
            )}
          </div>

          {/* Certificate details */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Certificate Details
            </h3>
            {[
              ['Worker Name', cert.workers?.name ?? '—'],
              ['Worker Code', cert.workers?.worker_code ?? '—'],
              ['Module', cert.modules?.name ?? '—'],
              ['Score', `${score}%`],
              ['Issued At', new Date(cert.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
              ['Status', cert.status?.toUpperCase() ?? '—'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid #f9fafb',
              }}>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Hash */}
          <div style={{ marginTop: 20, background: '#f9fafb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Certificate Hash (SHA-256)
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#374151', wordBreak: 'break-all', lineHeight: 1.6 }}>
              {cert.cert_hash ?? 'N/A'}
            </div>
          </div>

          {/* QR note */}
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            Scan QR code on printed certificate to verify authenticity
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 12, color: '#9ca3af' }}>
        Kholan Safety Compliance System · Jharkhand Industrial Training
      </div>
    </div>
  );
}
