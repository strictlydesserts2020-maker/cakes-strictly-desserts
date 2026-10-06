"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const MENUS = [
  { v: "mini", label: "Mini tiers (cake cards)" },
  { v: "bento", label: "Bento cakes" },
  { v: "generic", label: "Other cakes / default" },
  { v: "mini_cust", label: "Customise form — Mini tiers" },
];
const MENU_LABEL: Record<string, string> = {
  mini: "Mini tiers",
  bento: "Bento cakes",
  generic: "Other / default",
  mini_cust: "Customise (Mini)",
};

interface Flavour {
  id: string;
  name: string;
  menu: string;
  surcharge: number;
  addon_15: number;
  addon_2: number;
  sort_order: number;
  is_active: boolean;
}

const EMPTY = { id: "", name: "", menu: "mini", surcharge: 0, addon_15: 0, addon_2: 0, sort_order: 0, is_active: true };
type Form = typeof EMPTY;

export default function FlavoursManager() {
  const supabase = createClient();
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("flavours")
      .select("*")
      .order("menu", { ascending: true })
      .order("sort_order", { ascending: true });
    setFlavours((data ?? []) as Flavour[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  const startNew = () => setEditing({ ...EMPTY, sort_order: flavours.length + 1 });

  const startEdit = (f: Flavour) =>
    setEditing({
      id: f.id,
      name: f.name,
      menu: f.menu,
      surcharge: Number(f.surcharge),
      addon_15: Number(f.addon_15),
      addon_2: Number(f.addon_2),
      sort_order: f.sort_order,
      is_active: f.is_active,
    });

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      flash("Please enter a flavour name.");
      return;
    }
    setBusy(true);
    const payload = {
      name: editing.name.trim(),
      menu: editing.menu,
      surcharge: Number(editing.surcharge) || 0,
      addon_15: Number(editing.addon_15) || 0,
      addon_2: Number(editing.addon_2) || 0,
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active,
    };
    const res = editing.id
      ? await supabase.from("flavours").update(payload).eq("id", editing.id)
      : await supabase.from("flavours").insert(payload);
    setBusy(false);
    if (res.error) {
      flash("Save failed: " + res.error.message);
      return;
    }
    setEditing(null);
    flash("Saved ✓");
    load();
  };

  const toggleActive = async (f: Flavour) => {
    await supabase.from("flavours").update({ is_active: !f.is_active }).eq("id", f.id);
    load();
  };

  const remove = async (f: Flavour) => {
    if (!confirm(`Delete "${f.name}"? This cannot be undone.`)) return;
    await supabase.from("flavours").delete().eq("id", f.id);
    load();
  };

  const shown = flavours.filter((f) => filter === "all" || f.menu === filter);

  const priceText = (f: Flavour) => {
    if (f.menu === "mini") {
      const a = Number(f.addon_15), b = Number(f.addon_2);
      if (a > 0 || b > 0) return "1.5kg +₹" + a.toLocaleString("en-IN") + " · 2kg +₹" + b.toLocaleString("en-IN");
      return "—";
    }
    return Number(f.surcharge) > 0 ? "+₹" + Number(f.surcharge).toLocaleString("en-IN") : "—";
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-h1">Flavours</h1>
          <p className="admin-sub">Add, edit, enable/disable and price the flavours customers can choose.</p>
        </div>
        <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
          <select className="field" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "auto" }}>
            <option value="all">All menus</option>
            {MENUS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
          <button className="btn btn-gold" onClick={startNew}>+ Add Flavour</button>
        </div>
      </div>

      {msg && (
        <div className="admin-card" style={{ borderColor: "var(--gold)", color: "var(--gold2)", fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {editing && (
        <div className="admin-card">
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: "1.3rem", color: "var(--cream)", marginBottom: ".4rem" }}>
            {editing.id ? "Edit flavour" : "New flavour"}
          </h2>
          <div className="aform-grid">
            <div>
              <label className="alabel">Flavour name</label>
              <input className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Red Velvet Cheesecake" />
            </div>
            <div>
              <label className="alabel">Menu</label>
              <select className="field" value={editing.menu} onChange={(e) => setEditing({ ...editing, menu: e.target.value })}>
                {MENUS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="alabel">Flat surcharge (₹) — Bento / other</label>
              <input className="field" type="number" min={0} value={editing.surcharge} onChange={(e) => setEditing({ ...editing, surcharge: Number(e.target.value) })} placeholder="0" />
            </div>
            <div>
              <label className="alabel">Sort order</label>
              <input className="field" type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <div>
              <label className="alabel">Mini-tier surcharge at 1.5 kg (₹)</label>
              <input className="field" type="number" min={0} value={editing.addon_15} onChange={(e) => setEditing({ ...editing, addon_15: Number(e.target.value) })} placeholder="0" />
            </div>
            <div>
              <label className="alabel">Mini-tier surcharge at 2 kg (₹)</label>
              <input className="field" type="number" min={0} value={editing.addon_2} onChange={(e) => setEditing({ ...editing, addon_2: Number(e.target.value) })} placeholder="0" />
            </div>
          </div>
          <p style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: ".5rem" }}>
            Flat surcharge applies to Bento &amp; other cakes. The two Mini-tier fields add to the price only at 1.5 kg / 2 kg (1 kg has no surcharge).
          </p>
          <div style={{ display: "flex", gap: "1.4rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <label className="switch"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active (visible on site)</label>
          </div>
          <div className="modal-actions" style={{ marginTop: "1.4rem" }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}

      <div className="admin-card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="atable">
            <thead>
              <tr>
                <th>Flavour</th><th>Menu</th><th>Surcharge</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((f) => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td>{MENU_LABEL[f.menu] || f.menu}</td>
                  <td>{priceText(f)}</td>
                  <td><span className={"pill " + (f.is_active ? "on" : "off")}>{f.is_active ? "Active" : "Hidden"}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" onClick={() => startEdit(f)}>Edit</button>
                      <button className="mini-btn" onClick={() => toggleActive(f)}>{f.is_active ? "Disable" : "Enable"}</button>
                      <button className="mini-btn" style={{ color: "var(--rose)" }} onClick={() => remove(f)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan={5} style={{ color: "var(--muted)" }}>No flavours yet. Click &ldquo;Add Flavour&rdquo;.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
