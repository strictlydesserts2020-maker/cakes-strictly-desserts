import { MetadataRoute } from "next";
import { slugify } from "@/lib/utils";
import { staticCategories, staticProducts } from "@/lib/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.strictlydesserts.in";
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
  ];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const headers: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}` };
      const [catRes, prodRes] = await Promise.all([
        fetch(`${url}/rest/v1/categories?select=slug&is_active=eq.true&order=sort_order.asc`, { headers, next: { revalidate: 3600 } }),
        fetch(`${url}/rest/v1/products?select=id,name,categories(slug)&is_active=eq.true&order=sort_order.asc`, { headers, next: { revalidate: 3600 } }),
      ]);
      if (catRes.ok) {
        const cats: { slug: string }[] = await catRes.json();
        for (const c of cats) {
          if (c.slug) entries.push({ url: `${base}/cakes/${c.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
        }
      }
      if (prodRes.ok) {
        const prods: { id: string; name: string; categories: { slug: string } | null }[] = await prodRes.json();
        for (const p of prods) {
          const cslug = p.categories?.slug;
          if (!cslug) continue;
          const handle = `${slugify(p.name) || "cake"}-${p.id.slice(0, 8)}`;
          entries.push({ url: `${base}/cakes/${cslug}/${handle}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
        }
      }
    }
  } catch {
    // ignore; static fallback below
  }
  if (entries.length === 1) {
    // Supabase unavailable: build the sitemap from the static catalogue snapshot.
    for (const c of staticCategories()) entries.push({ url: `${base}/cakes/${c.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
    for (const p of staticProducts()) {
      const cslug = p.categories?.slug;
      if (!cslug || p.categories?.is_active === false) continue;
      entries.push({ url: `${base}/cakes/${cslug}/${slugify(p.name) || "cake"}-${String(p.id).slice(0, 8)}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    }
  }
  return entries;
}
