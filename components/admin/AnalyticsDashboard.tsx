"use client";
import { useEffect, useState } from "react";

interface GA4Data {
  configured: boolean;
  period?: string;
  sessions?: number;
  users?: number;
  orderClickRate?: string;
  waConversionRate?: string;
  leadRate?: string;
  orderClicks?: number;
  waClicks?: number;
  formSubmits?: number;
  categoryClicks?: number;
  productViews?: number;
  categories?: { name: string; count: number }[];
  landingPages?: { page: string; sessions: number }[];
  error?: string;
}

export default function AnalyticsDashboard() {
  const [d, setD] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(data => { setD(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const card: React.CSSProperties = { background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "0.75rem 1rem" };
  const secTitle: React.CSSProperties = { fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.75rem" };

  if (loading) return (
    <div className="admin-card" style={{ marginTop: "1.6rem" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading analytics…</p>
    </div>
  );

  if (!d?.configured) return (
    <div className="admin-card" style={{ marginTop: "1.6rem" }}>
      <h2 style={{ fontFamily: "var(--font-d)", fontSize: "1.1rem", color: "var(--cream)", marginBottom: "0.6rem" }}>Analytics — Setup Required</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Add these two env vars in Vercel to see live GA4 data here:</p>
      <ul style={{ color: "var(--muted)", fontSize: "0.8rem", paddingLeft: "1.2rem", lineHeight: "2" }}>
        <li><code style={{ color: "var(--cream)" }}>GA4_PROPERTY_ID</code> — e.g. <code>properties/123456789</code> (GA4 Admin → Property Settings → Property ID)</li>
        <li><code style={{ color: "var(--cream)" }}>GOOGLE_SERVICE_ACCOUNT_KEY</code> — JSON key string from Google Cloud Console service account</li>
      </ul>
      <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "0.8rem", color: "#d4856a", fontSize: "0.85rem" }}>
        Open GA4 Reports ↗
      </a>
    </div>
  );

  if (d.error) return (
    <div className="admin-card" style={{ marginTop: "1.6rem" }}>
      <p style={{ color: "#e57373", fontSize: "0.875rem" }}>Analytics error: {d.error}</p>
    </div>
  );

  const maxCat = Math.max(...(d.categories?.map(c => c.count) ?? [1]), 1);
  const maxLP = Math.max(...(d.landingPages?.map(l => l.sessions) ?? [1]), 1);

  return (
    <div style={{ marginTop: "1.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
        <h2 style={{ fontFamily: "var(--font-d)", fontSize: "1.2rem", color: "var(--cream)", margin: 0 }}>Analytics — {d.period}</h2>
        <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.78rem", color: "#d4856a" }}>Open GA4 ↗</a>
      </div>

      <div className="admin-grid" style={{ marginBottom: "1rem" }}>
        {([
          [d.sessions ?? 0, "Sessions"],
          [d.users ?? 0, "Visitors"],
          [d.orderClickRate + "%", "Order click rate"],
          [d.waConversionRate + "%", "WhatsApp rate"],
          [d.leadRate + "%", "Lead rate"],
        ] as [string | number, string][]).map(([v, label]) => (
          <div className="stat" key={label}><b>{String(v)}</b><span>{label}</span></div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div className="admin-card" style={{ padding: "1rem" }}>
          <p style={secTitle}>Top categories</p>
          {(d.categories ?? []).length === 0
            ? <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>No data yet — check back after 7 days.</p>
            : (d.categories ?? []).map(cat => (
              <div key={cat.name} style={{ marginBottom: "0.55rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "3px" }}>
                  <span style={{ color: "var(--cream)" }}>{cat.name}</span>
                  <span style={{ color: "var(--muted)" }}>{cat.count}</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (cat.count / maxCat * 100) + "%", background: "#d4856a", borderRadius: "2px" }} />
                </div>
              </div>
            ))}
        </div>

        <div className="admin-card" style={{ padding: "1rem" }}>
          <p style={secTitle}>Top landing pages</p>
          {(d.landingPages ?? []).length === 0
            ? <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>No data yet — check back after 24 hours.</p>
            : (d.landingPages ?? []).map(lp => (
              <div key={lp.page} style={{ marginBottom: "0.55rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "3px" }}>
                  <span style={{ color: "var(--cream)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{lp.page}</span>
                  <span style={{ color: "var(--muted)" }}>{lp.sessions}</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (lp.sessions / maxLP * 100) + "%", background: "#7a9cc4", borderRadius: "2px" }} />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="admin-card" style={{ padding: "1rem" }}>
        <p style={secTitle}>Event breakdown</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.6rem" }}>
          {([
            ["🛒", "Order clicks", d.orderClicks ?? 0],
            ["💬", "WhatsApp clicks", d.waClicks ?? 0],
            ["📝", "Form submits", d.formSubmits ?? 0],
            ["🎂", "Category clicks", d.categoryClicks ?? 0],
            ["👁", "Product views", d.productViews ?? 0],
          ] as [string, string, number][]).map(([icon, label, val]) => (
            <div key={label} style={card}>
              <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: "0 0 2px" }}>{icon} {label}</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--cream)", margin: 0 }}>{val.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
