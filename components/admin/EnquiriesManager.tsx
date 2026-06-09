"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Enquiry } from "@/lib/types";

export default function EnquiriesManager() {
  const supabase = createClient();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Enquiry[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleHandled = async (e: Enquiry) => {
    await supabase.from("enquiries").update({ is_handled: !e.is_handled }).eq("id", e.id);
    load();
  };
  const remove = async (e: Enquiry) => {
    if (!confirm("Delete this enquiry?")) return;
    await supabase.from("enquiries").delete().eq("id", e.id);
    load();
  };

  return (
    <>
      <h1 className="admin-h1">Enquiries</h1>
      <p className="admin-sub">Contact-form and “Customise Your Cake” submissions.</p>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="atable">
            <thead>
              <tr><th>When</th><th>Name</th><th>Contact</th><th>Type</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <Fragment key={e.id}>
                  <tr>
                    <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{new Date(e.created_at).toLocaleString("en-IN")}</td>
                    <td>{e.name}</td>
                    <td>{e.contact || "—"}</td>
                    <td><span className="badge">{e.source}</span></td>
                    <td><span className={"pill " + (e.is_handled ? "on" : "off")}>{e.is_handled ? "Handled" : "New"}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="mini-btn" onClick={() => setOpen(open === e.id ? null : e.id)}>{open === e.id ? "Hide" : "View"}</button>
                        <button className="mini-btn" onClick={() => toggleHandled(e)}>{e.is_handled ? "Mark new" : "Mark handled"}</button>
                        <button className="mini-btn" style={{ color: "var(--rose)" }} onClick={() => remove(e)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                  {open === e.id && (
                    <tr>
                      <td colSpan={6} style={{ background: "var(--surface2)" }}>
                        {e.category ? <p style={{ marginBottom: ".4rem" }}><b>Category:</b> {e.category}</p> : null}
                        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-b)", fontSize: ".84rem", color: "var(--cream2)", margin: 0 }}>{e.message}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!rows.length && (
                <tr><td colSpan={6} style={{ color: "var(--muted)" }}>No enquiries yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
