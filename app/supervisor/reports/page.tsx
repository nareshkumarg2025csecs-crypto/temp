export default function ReportsPage() {
  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Reports</h2>
      </div>
      <div style={{ padding: 28 }}>
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Reports Module</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            Compliance reports, incident logs, and audit trails will appear here.
          </p>
          <button className="btn-primary" style={{ marginTop: 16 }}>Generate Report</button>
        </div>
      </div>
    </>
  );
}
