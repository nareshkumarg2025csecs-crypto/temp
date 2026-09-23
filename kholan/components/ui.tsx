export function StatCard({
  label,
  value,
  sub,
  icon,
  danger = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
  danger?: boolean;
}) {
  return (
    <div className={`stat-card ${danger ? 'danger' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: danger ? '#991b1b' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        {icon && (
          <span style={{ fontSize: 18, opacity: 0.6 }}>{icon}</span>
        )}
        {danger && (
          <span style={{ fontSize: 16 }}>⚠️</span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: danger ? '#c0392b' : '#1a1a2e', lineHeight: 1.1, marginBottom: 6 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: danger ? '#991b1b' : '#6b7280', fontWeight: 500 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 80 ? '#27ae60' : pct >= 40 ? '#f39c12' : '#e74c3c';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div className="progress-bar-track" style={{ flex: 1 }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    certified:   { label: 'Certified',       cls: 'badge-certified' },
    pending:     { label: 'Pending',          cls: 'badge-pending' },
    expired:     { label: 'Expired',          cls: 'badge-expired' },
    verified:    { label: 'Verified',         cls: 'badge-verified' },
    revoked:     { label: 'Revoked',          cls: 'badge-revoked' },
    review:      { label: 'Pending Review',   cls: 'badge-review' },
    active:      { label: 'Active',           cls: 'badge-active' },
    suspended:   { label: 'Suspended',        cls: 'badge-suspended' },
    passed:      { label: 'Passed',           cls: 'badge-passed' },
    failed:      { label: 'Failed',           cls: 'badge-failed' },
  };
  const s = map[status?.toLowerCase()] ?? { label: status, cls: 'badge-pending' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
