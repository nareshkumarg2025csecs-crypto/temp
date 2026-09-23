export default function DGMSCertificates() {
  return (
    <>
      <div className="topbar"><h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Certificates — DGMS View</h2></div>
      <div style={{ padding: 28 }}>
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Certificate Registry</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Full certificate registry and DGMS approval management.</p>
          <a href="/dgms" className="btn-primary" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>
            Go to Audit Ledger
          </a>
        </div>
      </div>
    </>
  );
}
