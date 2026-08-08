"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";
import { inr, safeImg } from "@/lib/utils";

const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Baby Shower"];
const BADGES = ["", "Bestseller", "New", "Premium", "Eggless"];
const FLAVORS = [
  "",
  "Chocolate Truffle Cake",
  "Biscoff Chocolate",
  "Biscoff Vanilla",
  "Chunky Nutella",
  "White Chocolate & Blueberry",
  "Strawberry Cheesecake",
  "Vanilla & Butterscotch",
];

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
  flavor: "",
  is_active: true,
  sort_order: 0,
};
type Form = typeof EMPTY;

export default function ProductsManager() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  // ── Image byte-size for the "Size" column (Supabase storage metadata + HEAD fallback) ──
  const [sizes, setSizes] = useState<Record<string, number | null>>({});
  const fmtSize = (b?: number | null) => {
    if (b == null) return "—";
    if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
    if (b >= 1024) return Math.round(b / 1024) + " KB";
    return b + " B";
  };
  useEffect(() => {
    if (!products.length) return;
    let cancelled = false;
    const fileName = (u: string) => {
      const raw = u.split("?")[0].split("/").pop() || "";
      try { return decodeURIComponent(raw); } catch { return raw; }
    };
    (async () => {
      const byName: Record<string, number> = {};
      try {
        const { data: files } = await supabase.storage
          .from("product-images")
          .list("products", { limit: 1000 });
        (files ?? []).forEach((f: any) => {
          if (f?.name && f?.metadata?.size != null) byName[f.name] = f.metadata.size;
        });
      } catch {}
      const next: Record<string, number | null> = {};
      await Promise.all(
        products.map(async (p: any) => {
          const url = p.image_url;
          if (!url) { next[p.id] = null; return; }
          const key = fileName(url);
          if (byName[key] != null) { next[p.id] = byName[key]; return; }
          try {
            const r = await fetch(url, { method: "HEAD" });
            const len = r.headers.get("content-length");
            next[p.id] = len ? Number(len) : null;
          } catch { next[p.id] = null; }
        })
      );
      if (!cancelled) setSizes(next);
    })();
    return () => { cancelled = true; };
  }, [products, supabase]);
  const [filterCat, setFilterCat] = useState("");

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
      flavor: p.flavor ?? "",
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
      flavor: editing.flavor,
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

  const visibleProducts = filterCat ? products.filter(p => p.category_id === filterCat) : products;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-h1">Products</h1>
          <p className="admin-sub">Add, edit, enable/disable and price your cakes.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
          <select
            className="field"
            style={{ minWidth: 180, marginBottom: 0 }}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-gold" onClick={startNew}>+ Add Product</button>
        </div>
      </div>

      {msg && (
        <div className="admin-card" style={{ borderColor: "var(--gold)", color: "var(--gold2)", fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* EDIT / CREATE PANEL — modal overlay */}
      {editing && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            overflowY: "auto", padding: "2rem 1rem",
          }}
        >
        <div className="admin-card" style={{ width: "100%", maxWidth: 700, margin: "auto" }}>
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
              <label className="alabel">Flavor</label>
              <select className="field" value={editing.flavor} onChange={(e) => setEditing({ ...editing, flavor: e.target.value })}>
                {FLAVORS.map((f) => <option key={f} value={f}>{f || "— Choose flavor —"}</option>)}
              </select>
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
                <th></th><th>Name</th><th>Category</th><th>Price</th><th>Size</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => (
                <tr key={p.id}>
                  <td><img src={safeImg(p.image_url) || undefined} alt="" loading="lazy" style={{width:48,height:48,objectFit:"cover"}} /></td>
                  <td>
                    {p.name}
                    {p.badge ? <span className="badge" style={{ marginLeft: 6 }}>{p.badge}</span> : null}
                  </td>
                  <td>{p.category_name || "—"}</td>
                  <td>{inr(Number(p.price))}</td>
                  <td>
                    {(() => {
                      const b = sizes[p.id];
                      const big = b != null && b >= 1048576;
                      const mid = b != null && b >= 512000 && b < 1048576;
                      return <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: big ? 700 : 400, color: big ? "var(--rose)" : mid ? "#b8860b" : "var(--muted)" }}>{fmtSize(b)}</span>;
                    })()}
                  </td>
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
              {!visibleProducts.length && (
                <tr><td colSpan={7} style={{ color: "var(--muted)" }}>No products yet. Click “Add Product”.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
