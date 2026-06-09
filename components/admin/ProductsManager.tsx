"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";
import { inr, safeImg } from "@/lib/utils";

const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Baby Shower"];
const BADGES = ["", "Bestseller", "New", "Premium", "Eggless"];

const EMPTY = {
  id: "",
  name: "",
  description: "",
  price: 0,
  category_id: "",
  image_url: "",
  occasions: [] as string[],
  is_eggless: false,
  badge: "",
  rating: 4.8,
  is_active: true,
  sort_order: 0,
};
type Form = typeof EMPTY;

export default function ProductsManager() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: prod }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*, categories(name)").order("sort_order", { ascending: true }),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    ]);
    setProducts(
      (prod ?? []).map((p: any) => ({ ...p, category_name: p.categories?.name ?? "" }))
    );
    setCategories((cats ?? []) as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  const startNew = () =>
    setEditing({ ...EMPTY, category_id: categories[0]?.id ?? "", sort_order: products.length + 1 });

  const startEdit = (p: Product) =>
    setEditing({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      category_id: p.category_id ?? "",
      image_url: p.image_url ?? "",
      occasions: p.occasions ?? [],
      is_eggless: p.is_eggless,
      badge: p.badge ?? "",
      rating: Number(p.rating),
      is_active: p.is_active,
      sort_order: p.sort_order,
    });

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
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
      flash("Please enter a product name.");
      return;
    }
    setBusy(true);
    const payload = {
      name: editing.name.trim(),
      description: editing.description,
      price: Number(editing.price) || 0,
      category_id: editing.category_id || null,
      image_url: editing.image_url,
      occasions: editing.occasions,
      is_eggless: editing.is_eggless,
      badge: editing.badge,
      rating: Number(editing.rating) || 4.8,
      is_active: editing.is_active,
      sort_order: Number(editing.sort_order) || 0,
    };
    const res = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setBusy(false);
    if (res.error) {
      flash("Save failed: " + res.error.message);
      return;
    }
    setEditing(null);
    flash(editing.id ? "Product updated" : "Product added");
    load();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    flash("Product deleted");
    load();
  };

  const toggleOcc = (o: string) =>
    setEditing((f) =>
      f ? { ...f, occasions: f.occasions.includes(o) ? f.occasions.filter((x) => x !== o) : [...f.occasions, o] } : f
    );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-h1">Products</h1>
          <p className="admin-sub">Add, edit, enable/disable and price your cakes.</p>
        </div>
        <button className="btn btn-gold" onClick={startNew}>+ Add Product</button>
      </div>

      {msg && (
        <div className="admin-card" style={{ borderColor: "var(--gold)", color: "var(--gold2)", fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* EDIT / CREATE PANEL */}
      {editing && (
        <div className="admin-card">
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: "1.3rem", color: "var(--cream)", marginBottom: ".4rem" }}>
            {editing.id ? "Edit product" : "New product"}
          </h2>

          <div className="aform-grid">
            <div>
              <label className="alabel">Name</label>
              <input className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="alabel">Price (₹)</label>
              <input className="field" type="number" min={0} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="alabel">Category</label>
              <select className="field" value={editing.category_id} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="alabel">Badge</label>
              <select className="field" value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })}>
                {BADGES.map((b) => <option key={b} value={b}>{b || "— none —"}</option>)}
              </select>
            </div>
            <div>
              <label className="alabel">Rating</label>
              <input className="field" type="number" min={0} max={5} step={0.1} value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} />
            </div>
            <div>
              <label className="alabel">Sort order</label>
              <input className="field" type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
          </div>

          <label className="alabel">Description</label>
          <textarea className="field" style={{ minHeight: 70 }} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

          <label className="alabel">Occasions</label>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {OCCASIONS.map((o) => (
              <span key={o} role="button" tabIndex={0} className={"chip" + (editing.occasions.includes(o) ? " active" : "")} onClick={() => toggleOcc(o)}>
                {o}
              </span>
            ))}
          </div>

          <label className="alabel">Product image</label>
          <div className="thumb-drop">
            <img src={safeImg(editing.image_url) || undefined} alt="" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            <div>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              {uploading && <p style={{ fontSize: ".78rem", color: "var(--gold2)" }}>Uploading…</p>}
            </div>
          </div>
          <label className="alabel">…or paste an image URL</label>
          <input className="field" value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />

          <div style={{ display: "flex", gap: "1.4rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <label className="switch"><input type="checkbox" checked={editing.is_eggless} onChange={(e) => setEditing({ ...editing, is_eggless: e.target.checked })} /> Eggless</label>
            <label className="switch"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active (visible on site)</label>
          </div>

          <div className="modal-actions" style={{ marginTop: "1.4rem" }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="admin-card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="atable">
            <thead>
              <tr>
                <th></th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><img src={safeImg(p.image_url) || undefined} alt="" /></td>
                  <td>
                    {p.name}
                    {p.badge ? <span className="badge" style={{ marginLeft: 6 }}>{p.badge}</span> : null}
                  </td>
                  <td>{p.category_name || "—"}</td>
                  <td>{inr(Number(p.price))}</td>
                  <td><span className={"pill " + (p.is_active ? "on" : "off")}>{p.is_active ? "Active" : "Hidden"}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" onClick={() => startEdit(p)}>Edit</button>
                      <button className="mini-btn" onClick={() => toggleActive(p)}>{p.is_active ? "Disable" : "Enable"}</button>
                      <button className="mini-btn" style={{ color: "var(--rose)" }} onClick={() => remove(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr><td colSpan={6} style={{ color: "var(--muted)" }}>No products yet. Click “Add Product”.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
