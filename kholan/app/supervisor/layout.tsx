import Sidebar from '@/components/Sidebar';

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f7' }}>
      <Sidebar role="supervisor" />
      <div className="main-content" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
