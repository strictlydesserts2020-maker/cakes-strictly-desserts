"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Enquiry } from "@/lib/types";

/* ── Excel export via SheetJS (loaded from CDN at runtime to keep bundle small) ── */
async function exportToExcel(rows: Enquiry[]) {
  // @ts-ignore — dynamic CDN load
  if (!window.XLSX) {
    await new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = () => res();
      s.onerror = () => rej(new Error("Failed to load SheetJS"));
      document.head.appendChild(s);
    });
  }
  // @ts-ignore
  const XLSX = window.XLSX;

  const data = rows.map((e) => ({
    "Date": new Date(e.created_at).toLocaleString("en-IN"),
    "Name": e.name,
    "Contact": e.contact ?? "",
    "Type": e.source,
    "Category": e.category ?? "",
    "Handled": e.is_handled ? "Yes" : "No",
    "Order Status": e.order_status ?? "pending",
    "Final Payment (₹)": e.final_payment ?? "",
    "Delivery Date": e.delivery_date ?? "",
    "Message": e.message,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Enquiries");

  // Column widths
  ws["!cols"] = [
    { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
    { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 60 },
  ];

  XLSX.writeFile(wb, `strictly-desserts-enquiries-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export default function EnquiriesManager() {
  const supabase = createClient();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  // Inline editable fields keyed by enquiry id
  const [edits, setEdits] = useState<Record<string, { payment: string; date: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    const fetched = (data ?? []) as Enquiry[];
    setRows(fetched);
    // Seed edit state
    const init: Record<string, { payment: string; date: string }> = {};
    fetched.forEach((e) => {
      init[e.id] = {
        payment: e.final_payment != null ? String(e.final_payment) : "",
        date: e.delivery_date ?? "",
      };
    });
    setEdits(init);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const patch = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setSaving(id);
    await fetch("/api/enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    setSaving(null);
    load();
  }, [load]);

  const toggleHandled = (e: Enquiry) => patch(e.id, { is_handled: !e.is_handled });

  const setOrderStatus = (e: Enquiry, status: "accepted" | "rejected" | "pending") =>
    patch(e.id, { order_status: status });

  const savePaymentAndDate = (e: Enquiry) => {
    const ed = edits[e.id];
    if (!ed) return;
    patch(e.id, {
      final_payment: ed.payment === "" ? null : parseFloat(ed.payment),
      delivery_date: ed.date === "" ? null : ed.date,
    });
  };

  const remove = async (e: Enquiry) => {
    if (!confirm("Delete this enquiry?")) return;
    await supabase.from("enquiries").delete().eq("id", e.id);
    load();
  };

  const statusColor = (s: string) => {
    if (s === "accepted") return { background: "#e8f8ee", color: "#1a7a3c", border: "1px solid #25d366" };
    if (s === "rejected") return { background: "#fdecea", color: "#c0392b", border: "1px solid #e74c3c" };
    return { background: "#fff8ea", color: "#8a6a00", border: "1px solid #f5c842" };
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "0.5rem" }}>
        <div>
          <h1 className="admin-h1" style={{ marginBottom: 0 }}>Enquiries</h1>
          <p className="admin-sub">Contact-form and "Customise Your Cake" submissions.</p>
        </div>
        <button
          className="btn btn-gold"
          style={{ whiteSpace: "nowrap" }}
          onClick={() => exportToExcel(rows)}
          disabled={loading || !rows.length}
        >
          ⬇ Export to Excel
        </button>
      </div>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="atable">
            <thead>
              <tr>
                <th>When</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Order Status</th>
                <th>Final Payment</th>
                <th>Delivery Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const ed = edits[e.id] ?? { payment: "", date: "" };
                const isSaving = saving === e.id;
                const os = e.order_status ?? "pending";
                return (
                  <Fragment key={e.id}>
                    <tr>
                      {/* When */}
                      <td style={{ color: "var(--muted)", whiteSpace: "nowrap", fontSize: ".82rem" }}>
                        {new Date(e.created_at).toLocaleString("en-IN")}
                      </td>
                      {/* Name */}
                      <td>{e.name}</td>
                      {/* Contact */}
                      <td>{e.contact || "—"}</td>
                      {/* Type */}
                      <td><span className="badge">{e.source}</span></td>
                      {/* Handled status */}
                      <td>
                        <span className={"pill " + (e.is_handled ? "on" : "off")}>
                          {e.is_handled ? "Handled" : "New"}
                        </span>
                      </td>
                      {/* Existing actions */}
                      <td>
                        <div className="row-actions">
                          <button className="mini-btn" onClick={() => setOpen(open === e.id ? null : e.id)}>
                            {open === e.id ? "Hide" : "View"}
                          </button>
                          <button className="mini-btn" onClick={() => toggleHandled(e)}>
                            {e.is_handled ? "Mark new" : "Mark handled"}
                          </button>
                          <button className="mini-btn" style={{ color: "var(--rose)" }} onClick={() => remove(e)}>
                            Delete
                          </button>
                        </div>
                      </td>

                      {/* ── NEW: Order Status ── */}
                      <td style={{ minWidth: "140px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span className="pill" style={{ ...statusColor(os), display: "inline-block", marginBottom: "4px", fontSize: ".78rem", padding: "2px 10px", borderRadius: "20px" }}>
                            {os.charAt(0).toUpperCase() + os.slice(1)}
                          </span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              className="mini-btn"
                              style={os === "accepted" ? { background: "#e8f8ee", color: "#1a7a3c" } : {}}
                              disabled={isSaving || os === "accepted"}
                              onClick={() => setOrderStatus(e, "accepted")}
                            >✓ Accept</button>
                            <button
                              className="mini-btn"
                              style={os === "rejected" ? { background: "#fdecea", color: "#c0392b" } : {}}
                              disabled={isSaving || os === "rejected"}
                              onClick={() => setOrderStatus(e, "rejected")}
                            >✗ Reject</button>
                          </div>
                        </div>
                      </td>

                      {/* ── NEW: Final Payment ── */}
                      <td style={{ minWidth: "140px" }}>
                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={ed.payment}
                            onChange={(ev) => setEdits((prev) => ({ ...prev, [e.id]: { ...ed, payment: ev.target.value } }))}
                            style={{
                              width: "90px", padding: "4px 6px", border: "1px solid #ddd",
                              borderRadius: "6px", fontSize: ".85rem",
                            }}
                          />
                        </div>
                      </td>

                      {/* ── NEW: Delivery Date ── */}
                      <td style={{ minWidth: "180px" }}>
                        <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            type="date"
                            value={ed.date}
                            onChange={(ev) => setEdits((prev) => ({ ...prev, [e.id]: { ...ed, date: ev.target.value } }))}
                            style={{
                              padding: "4px 6px", border: "1px solid #ddd",
                              borderRadius: "6px", fontSize: ".82rem",
                            }}
                          />
                          <button
                            className="mini-btn"
                            style={{ background: "var(--gold)", color: "#fff", border: "none" }}
                            disabled={isSaving}
                            onClick={() => savePaymentAndDate(e)}
                          >{isSaving ? "…" : "Save"}</button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable message row */}
                    {open === e.id && (
                      <tr>
                        <td colSpan={9} style={{ background: "var(--surface2)" }}>
                          {e.category && <p style={{ marginBottom: ".4rem" }}><b>Category:</b> {e.category}</p>}
                          <pre style={{
                            whiteSpace: "pre-wrap", fontFamily: "var(--font-b)",
                            fontSize: ".84rem", color: "var(--cream2)", margin: 0,
                          }}>{e.message}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={9} style={{ color: "var(--muted)" }}>No enquiries yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
