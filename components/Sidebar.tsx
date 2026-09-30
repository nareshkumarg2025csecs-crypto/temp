'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

const supervisorNav = [
  { href: '/supervisor', label: 'Dashboard', icon: '⊞' },
  { href: '/supervisor/workers', label: 'Workers', icon: '👷' },
  { href: '/supervisor/certificates', label: 'Certificates', icon: '📋' },
];

const dgmsNav = [
  { href: '/dgms', label: 'Dashboard', icon: '⊞' },
  { href: '/dgms/workers', label: 'Personnel', icon: '👷' },
  { href: '/dgms/certificates', label: 'Certificates', icon: '📋' },
  { href: '/dgms/reports', label: 'Reports', icon: '📊' },
  { href: '/dgms/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({ role }: { role: 'supervisor' | 'dgms' }) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === 'supervisor' ? supervisorNav : dgmsNav;

  function handleLogout() {
    document.cookie = 'kholan_session=; Max-Age=0; path=/';
    document.cookie = 'kholan_role=; Max-Age=0; path=/';
    document.cookie = 'kholan_user=; Max-Age=0; path=/';
    router.push('/login');
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/logo-icon.png"
            alt="Kholan icon"
            width={36}
            height={36}
            style={{ objectFit: 'contain' }}
          />
          <Image
            src="/logo-wordmark.png"
            alt="KHOLAN"
            width={100}
            height={28}
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6, paddingLeft: 46 }}>
          {role === 'supervisor' ? 'Industrial Admin' : 'DGMS Official'}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/supervisor' && item.href !== '/dgms' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '12px 12px 8px' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '10px 12px', background: 'transparent',
            border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer',
            borderRadius: 8, marginTop: 4,
          }}
        >
          <span>↩</span> Logout
        </button>
        <div style={{ fontSize: 11, color: '#4b5563', padding: '8px 4px 4px', textAlign: 'center' }}>
          ⚙ Support
        </div>
      </div>
    </div>
  );
}
