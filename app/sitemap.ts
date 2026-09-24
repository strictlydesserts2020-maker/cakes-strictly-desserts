import { MetadataRoute } from "next";

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
      const res = await fetch(
        `${url}/rest/v1/categories?select=name&order=sort_order.asc`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const cats: { name: string }[] = await res.json();
        for (const c of cats) {
          const slug = c.name.toLowerCase().replace(/\s+/g, "-");
          entries.push({ url: `${base}/?cat=${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
        }
      }
    }
  } catch {
    // fall back to homepage-only sitemap on any error
  }
  return entries;
}
