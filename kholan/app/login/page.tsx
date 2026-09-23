'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'supervisor' | 'dgms'>('supervisor');
  const [officialId, setOfficialId] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Map Official ID to email for Supabase auth
    const email = `${officialId.toLowerCase().replace(/\s+/g, '.')}@kholan.in`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: token,
      });

      if (authError || !authData.user) {
        setError('Invalid credentials. Check your Official ID and Security Token.');
        setLoading(false);
        return;
      }

      // Fetch user role from users table
      const { data: userData } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', authData.user.id)
        .single();

      const userRole = userData?.role ?? role;

      // Set cookies for middleware
      document.cookie = `kholan_session=${authData.session?.access_token}; path=/; max-age=86400`;
      document.cookie = `kholan_role=${userRole}; path=/; max-age=86400`;
      document.cookie = `kholan_user=${encodeURIComponent(userData?.name ?? officialId)}; path=/; max-age=86400`;

      if (userRole === 'dgms') {
        router.push('/dgms');
      } else {
        router.push('/supervisor');
      }
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* Hero Panel */}
      <div className="login-hero">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/logo-icon.png" alt="Kholan" width={48} height={48} style={{ objectFit: 'contain' }} />
            <Image src="/logo-wordmark.png" alt="KHOLAN" width={130} height={36} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div style={{ marginTop: 8, color: '#f97316', fontSize: 13, fontWeight: 500, letterSpacing: '0.04em' }}>
            Industrial Admin &amp; Compliance
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ borderLeft: '3px solid #c0392b', paddingLeft: 16 }}>
            <p style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
              &ldquo;Ensuring uncompromising safety standards across all industrial operations in the Jharkhand district.&rdquo;
            </p>
          </div>
          <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 12, marginBottom: 0 }}>
            Kholan Safety | Jharkhand Industrial Training
          </p>
        </div>

        {/* Decorative glows */}
        <div style={{
          position: 'absolute', top: '30%', left: '20%',
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(192,57,43,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '25%', right: '15%',
          width: 150, height: 150,
          background: 'radial-gradient(circle, rgba(230,126,34,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Form Panel */}
      <div className="login-form-panel">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Image src="/logo-icon.png" alt="Kholan" width={56} height={56} style={{ objectFit: 'contain' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '12px 0 4px' }}>
            System Login
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Enter your credentials to access the secure safety portal.
          </p>
        </div>

        <form onSubmit={handleAuth}>
          {/* Role toggle */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Select Role
            </label>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-toggle-btn ${role === 'supervisor' ? 'active' : ''}`}
                onClick={() => setRole('supervisor')}
              >
                Supervisor
              </button>
              <button
                type="button"
                className={`role-toggle-btn ${role === 'dgms' ? 'active' : ''}`}
                onClick={() => setRole('dgms')}
              >
                DGMS Official
              </button>
            </div>
          </div>

          {/* Official ID */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Official ID / Username
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 15 }}>🪪</span>
              <input
                type="text"
                placeholder="e.g. EMP-4920"
                value={officialId}
                onChange={e => setOfficialId(e.target.value)}
                required
                style={{
                  width: '100%', padding: '11px 12px 11px 36px',
                  border: '1.5px solid #e5e7eb', borderRadius: 8,
                  fontSize: 14, outline: 'none', color: '#1a1a2e',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#c0392b')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
          </div>

          {/* Security Token */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Security Token
              </label>
              <span style={{ fontSize: 12, color: '#c0392b', cursor: 'pointer' }}>Forgot?</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 15 }}>🔐</span>
              <input
                type="password"
                placeholder="••••••••"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                style={{
                  width: '100%', padding: '11px 12px 11px 36px',
                  border: '1.5px solid #e5e7eb', borderRadius: 8,
                  fontSize: 14, outline: 'none', color: '#1a1a2e',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#c0392b')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fed7d7',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: '#c0392b', fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #c0392b, #e67e22)',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em', transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Authenticating...' : 'AUTHENTICATE →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: '#9ca3af' }}>
          Kholan Safety | Jharkhand Industrial Training
        </div>
      </div>
    </div>
  );
}
