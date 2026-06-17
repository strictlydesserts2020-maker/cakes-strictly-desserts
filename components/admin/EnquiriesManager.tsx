"use client";

import { useEffect, useState, useCallback, Fragment, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Enquiry } from "@/lib/types";

/* ── Excel export via SheetJS ── */
async function exportToExcel(rows: Enquiry[]) {
  // @ts-ignore
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
    "Order #": e.order_number ? "SD-" + String(e.order_number).padStart(4, "0") : "",
    "Order Date": new Date(e.created_at).toLocaleDateString("en-IN"),
    "Order Time": new Date(e.created_at).toLocaleTimeString("en-IN"),
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
  ws["!cols"] = [
    { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 16 },
    { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 60 },
  ];
  XLSX.writeFile(wb, `strictly-desserts-enquiries-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

const fmtOrderNo = (n?: number) =>
  n != null ? "SD-" + String(n).padStart(4, "0") : "—";

const statusStyle = (s: string) => {
  if (s === "accepted") return { background: "#e8f8ee", color: "#1a7a3c", border: "1px solid #25d366" };
  if (s === "rejected") return { background: "#fdecea", color: "#c0392b", border: "1px solid #e74c3c" };
  return { background: "#fff8ea", color: "#8a6a00", border: "1px solid #f5c842" };
};

export default function EnquiriesManager() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { payment: string; date: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    const fetched = (data ?? []) as Enquiry[];
    setRows(fetched);
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

      <div className="admin-card" style={{ overflowX: "visible" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="atable" style={{ width: "100%", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "72px" }} />
              <col style={{ width: "90px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "68px" }} />
              <col style={{ width: "68px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "210px" }} />
              <col style={{ width: "160px" }} />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Order Status</th>
                <th>Payment & Delivery</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const ed = edits[e.id] ?? { payment: "", date: "" };
                const isSaving = saving === e.id;
                const os = e.order_status ?? "pending";
                const dt = new Date(e.created_at);
                return (
                  <Fragment key={e.id}>
                    <tr>
                      {/* Order # */}
                      <td style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--gold)", whiteSpace: "nowrap" }}>
                        {fmtOrderNo(e.order_number)}
                      </td>

                      {/* Date & Time */}
                      <td style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.4 }}>
                        <div>{dt.toLocaleDateString("en-IN")}</div>
                        <div style={{ fontSize: ".72rem" }}>{dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>

                      {/* Customer */}
                      <td style={{ overflow: "hidden" }}>
                        <div style={{ fontWeight: 600, fontSize: ".85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
                        <div style={{ fontSize: ".75rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.contact || "—"}</div>
                      </td>

                      {/* Type */}
                      <td><span className="badge" style={{ fontSize: ".72rem" }}>{e.source}</span></td>

                      {/* Status */}
                      <td>
                        <span className={"pill " + (e.is_handled ? "on" : "off")} style={{ fontSize: ".75rem" }}>
                          {e.is_handled ? "Done" : "New"}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td>
                        <span className="pill" style={{ ...statusStyle(os), display: "inline-block", fontSize: ".72rem", padding: "2px 8px", borderRadius: "20px", marginBottom: "4px" }}>
                          {os.charAt(0).toUpperCase() + os.slice(1)}
                        </span>
                        <div style={{ display: "flex", gap: "3px" }}>
                          <button
                            className="mini-btn"
                            style={os === "accepted" ? { background: "#e8f8ee", color: "#1a7a3c", fontSize: ".72rem", padding: "2px 6px" } : { fontSize: ".72rem", padding: "2px 6px" }}
                            disabled={isSaving || os === "accepted"}
                            onClick={() => setOrderStatus(e, "accepted")}
                          >✓</button>
                          <button
                            className="mini-btn"
                            style={os === "rejected" ? { background: "#fdecea", color: "#c0392b", fontSize: ".72rem", padding: "2px 6px" } : { fontSize: ".72rem", padding: "2px 6px" }}
                            disabled={isSaving || os === "rejected"}
                            onClick={() => setOrderStatus(e, "rejected")}
                          >✗</button>
                        </div>
                      </td>

                      {/* Payment & Delivery */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>₹</span>
                            <input
                              type="number" min="0" step="0.01" placeholder="0"
                              value={ed.payment}
                              onChange={(ev) => setEdits((prev) => ({ ...prev, [e.id]: { ...ed, payment: ev.target.value } }))}
                              style={{ width: "75px", padding: "3px 5px", border: "1px solid #ddd", borderRadius: "5px", fontSize: ".8rem" }}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <input
                              type="date"
                              value={ed.date}
                              onChange={(ev) => setEdits((prev) => ({ ...prev, [e.id]: { ...ed, date: ev.target.value } }))}
                              style={{ padding: "3px 5px", border: "1px solid #ddd", borderRadius: "5px", fontSize: ".75rem", width: "120px" }}
                            />
                            <button
                              className="mini-btn"
                              style={{ background: "var(--gold)", color: "#fff", border: "none", fontSize: ".72rem", padding: "3px 6px" }}
                              disabled={isSaving}
                              onClick={() => savePaymentAndDate(e)}
                            >{isSaving ? "…" : "💾"}</button>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <button className="mini-btn" style={{ fontSize: ".75rem" }} onClick={() => setOpen(open === e.id ? null : e.id)}>
                            {open === e.id ? "Hide msg" : "View msg"}
                          </button>
                          <button className="mini-btn" style={{ fontSize: ".75rem" }} onClick={() => toggleHandled(e)}>
                            {e.is_handled ? "Mark new" : "Mark done"}
                          </button>
                          <button className="mini-btn" style={{ color: "var(--rose)", fontSize: ".75rem" }} onClick={() => remove(e)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable message row */}
                    {open === e.id && (
                      <tr>
                        <td colSpan={8} style={{ background: "var(--surface2)" }}>
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
                <tr><td colSpan={8} style={{ color: "var(--muted)" }}>No enquiries yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
