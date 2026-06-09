"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";
import { safeImg, slugify } from "@/lib/utils";

const EMPTY = {
  id: "",
  name: "",
  slug: "",
  description: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};
type Form = typeof EMPTY;

export default function CategoriesManager() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  const startNew = () => setEditing({ ...EMPTY, sort_order: categories.length + 1 });
  const startEdit = (c: Category) =>
    setEditing({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image_url: c.image_url ?? "",
      sort_order: c.sort_order,
      is_active: c.is_active,
    });

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600" });
    if (error) {
      flash("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing((f) => (f ? { ...f, image_url: data.publicUrl } : f));
    setUploading(false);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      flash("Please enter a category name.");
      return;
    }
    setBusy(true);
    const payload = {
      name: editing.name.trim(),
      slug: slugify(editing.slug || editing.name),
      description: editing.description,
      image_url: editing.image_url,
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active,
    };
    const res = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    setBusy(false);
    if (res.error) {
      flash("Save failed: " + res.error.message);
      return;
    }
    setEditing(null);
    flash(editing.id ? "Category updated" : "Category added");
    load();
  };

  const toggleActive = async (c: Category) => {
    await supabase.from("categories").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete the "${c.name}" category? Products keep their data but lose this category.`)) return;
    await supabase.from("categories").delete().eq("id", c.id);
    flash("Category deleted");
    load();
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-h1">Categories</h1>
          <p className="admin-sub">Organise your storefront into collections.</p>
        </div>
        <button className="btn btn-gold" onClick={startNew}>+ Add Category</button>
      </div>

      {msg && (
        <div className="admin-card" style={{ borderColor: "var(--gold)", color: "var(--gold2)", fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {editing && (
        <div className="admin-card">
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: "1.3rem", color: "var(--cream)", marginBottom: ".4rem" }}>
            {editing.id ? "Edit category" : "New category"}
          </h2>
          <div className="aform-grid">
            <div>
              <label className="alabel">Name</label>
              <input className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="alabel">Slug <span style={{ textTransform: "none", color: "var(--muted)" }}>(auto if blank)</span></label>
              <input className="field" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder={slugify(editing.name)} />
            </div>
            <div>
              <label className="alabel">Sort order</label>
              <input className="field" type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
          </div>

          <label className="alabel">Short description</label>
          <input className="field" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="One line under the title" />

          <label className="alabel">Category image</label>
          <div className="thumb-drop">
            <img src={safeImg(editing.image_url) || undefined} alt="" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            <div>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              {uploading && <p style={{ fontSize: ".78rem", color: "var(--gold2)" }}>Uploading…</p>}
            </div>
          </div>
          <label className="alabel">…or paste an image URL</label>
          <input className="field" value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />

          <label className="switch" style={{ marginTop: "1rem" }}>
            <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active (visible on site)
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
              <tr><th></th><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td><img src={safeImg(c.image_url) || undefined} alt="" /></td>
                  <td>{c.name}</td>
                  <td style={{ color: "var(--muted)" }}>{c.slug}</td>
                  <td><span className={"pill " + (c.is_active ? "on" : "off")}>{c.is_active ? "Active" : "Hidden"}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" onClick={() => startEdit(c)}>Edit</button>
                      <button className="mini-btn" onClick={() => toggleActive(c)}>{c.is_active ? "Disable" : "Enable"}</button>
                      <button className="mini-btn" style={{ color: "var(--rose)" }} onClick={() => remove(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!categories.length && (
                <tr><td colSpan={5} style={{ color: "var(--muted)" }}>No categories yet. Click “Add Category”.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
