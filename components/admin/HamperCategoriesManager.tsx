"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeImg } from "@/lib/utils";

type HamperCat = {
  id: string;
  title: string;
  image_url: string | null;
  icon_emoji: string;
  bg_color: string;
  sort_order: number;
  is_active: boolean;
};

const DEFAULTS = [
  { title: "Baby Naming & Seemantham Favours", icon_emoji: "🍼", bg_color: "#fdf0e6" },
  { title: "Birthday Return Gifts",            icon_emoji: "🎂", bg_color: "#fdeef0" },
  { title: "Children's Snack Boxes",           icon_emoji: "🍫", bg_color: "#f0f7ee" },
  { title: "Festive Gift Hampers",             icon_emoji: "🪔", bg_color: "#fdf6e3" },
  { title: "Wedding & Event Favours",          icon_emoji: "💍", bg_color: "#f3eeff" },
  { title: "Corporate Gifting",                icon_emoji: "🏢", bg_color: "#e8f4ff" },
  { title: "Employee Appreciation Gifts",      icon_emoji: "👏", bg_color: "#f0fdf4" },
  { title: "Custom Branded Hampers",           icon_emoji: "🎀", bg_color: "#fff0f6" },
];

const EMPTY: Omit<HamperCat, "id"> = {
  title: "", image_url: "", icon_emoji: "🎁", bg_color: "#fdf0e6",
  sort_order: 0, is_active: true,
};

export default function HamperCategoriesManager() {
  const supabase = createClient();
  const [items, setItems] = useState<HamperCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Omit<HamperCat, "id"> & { id?: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [seeded, setSeeded] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hamper_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    setItems((data ?? []) as HamperCat[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const seed = async () => {
    setBusy(true);
    for (let i = 0; i < DEFAULTS.length; i++) {
      await supabase.from("hamper_categories").insert({
        ...DEFAULTS[i], image_url: null, sort_order: i + 1, is_active: true,
      });
    }
    setBusy(false);
    setSeeded(true);
    flash("Default categories seeded!");
    load();
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `hamper-categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600" });
    if (error) { flash("Upload failed: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing((f) => f ? { ...f, image_url: data.publicUrl } : f);
    setUploading(false);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) { flash("Title is required."); return; }
    setBusy(true);
    const payload = {
      title: editing.title.trim(),
      image_url: editing.image_url || null,
      icon_emoji: editing.icon_emoji,
      bg_color: editing.bg_color,
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active,
    };
    const res = editing.id
      ? await supabase.from("hamper_categories").update(payload).eq("id", editing.id)
      : await supabase.from("hamper_categories").insert(payload);
    setBusy(false);
    if (res.error) { flash("Save failed: " + res.error.message); return; }
    setEditing(null);
    flash(editing.id ? "Updated!" : "Added!");
    load();
  };

  const remove = async (item: HamperCat) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await supabase.from("hamper_categories").delete().eq("id", item.id);
    flash("Deleted.");
    load();
  };

  const toggleActive = async (item: HamperCat) => {
    await supabase.from("hamper_categories").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-h1">Gift Hamper Categories</h1>
          <p className="admin-sub">Manage the "What We Can Create For You" tiles on the Gift Hampers page.</p>
        </div>
        <div style={{ display: "flex", gap: ".6rem" }}>
          {!seeded && items.length === 0 && (
            <button className="btn btn-ghost" onClick={seed} disabled={busy}>Seed defaults</button>
          )}
          <button className="btn btn-gold" onClick={() => setEditing({ ...EMPTY, sort_order: items.length + 1 })}>+ Add Category</button>
        </div>
      </div>

      {msg && <div className="admin-card" style={{ borderColor: "var(--gold)", color: "var(--gold2)", fontWeight: 600 }}>{msg}</div>}

      {editing && (
        <div className="admin-card">
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: "1.3rem", color: "var(--cream)", marginBottom: ".8rem" }}>
            {editing.id ? "Edit category" : "New category"}
          </h2>
          <div className="aform-grid">
            <div>
              <label className="alabel">Title</label>
              <input className="field" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Baby Naming & Seemantham Favours" />
            </div>
            <div>
              <label className="alabel">Icon Emoji <span style={{ textTransform: "none", color: "var(--muted)" }}>(shown when no image)</span></label>
              <input className="field" value={editing.icon_emoji} onChange={e => setEditing({ ...editing, icon_emoji: e.target.value })} placeholder="🎁" />
            </div>
            <div>
              <label className="alabel">Card Background Colour</label>
              <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                <input type="color" value={editing.bg_color} onChange={e => setEditing({ ...editing, bg_color: e.target.value })} style={{ width: "2.5rem", height: "2.5rem", border: "none", cursor: "pointer" }} />
                <input className="field" value={editing.bg_color} onChange={e => setEditing({ ...editing, bg_color: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
            <div>
              <label className="alabel">Sort Order</label>
              <input className="field" type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
          </div>

          <label className="alabel" style={{ marginTop: "1rem", display: "block" }}>Upload Image</label>
          <div className="thumb-drop">
            {editing.image_url && <img src={safeImg(editing.image_url) || undefined} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />}
            <div>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              {uploading && <p style={{ fontSize: ".78rem", color: "var(--gold2)" }}>Uploading…</p>}
            </div>
          </div>
          <label className="alabel">…or paste image URL</label>
          <input className="field" value={editing.image_url ?? ""} onChange={e => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />

          <label className="switch" style={{ marginTop: "1rem" }}>
            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> Visible on site
          </label>

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
              <tr><th>Preview</th><th>Title</th><th>Emoji</th><th>Order</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ width: 60, height: 60, background: item.bg_color, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>
                      {item.image_url
                        ? <img src={safeImg(item.image_url) || undefined} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
                        : item.icon_emoji}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.title}</td>
                  <td>{item.icon_emoji}</td>
                  <td>{item.sort_order}</td>
                  <td><span className={"pill " + (item.is_active ? "on" : "off")}>{item.is_active ? "Active" : "Hidden"}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" onClick={() => setEditing({ ...item })}>Edit</button>
                      <button className="mini-btn" onClick={() => toggleActive(item)}>{item.is_active ? "Disable" : "Enable"}</button>
                      <button className="mini-btn" style={{ color: "var(--rose)" }} onClick={() => remove(item)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={6} style={{ color: "var(--muted)" }}>No categories yet. Click "Seed defaults" to add the 8 standard ones, or "+ Add Category".</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
