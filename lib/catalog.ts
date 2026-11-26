// ------------------------------------------------------------
//  Static catalogue snapshot (exported from Supabase on 26 Nov 2026).
//  Used as a fallback whenever Supabase can't be reached, so the
//  storefront keeps working even if the database is down or
//  restricted. Product photos are served from /public/catalog
//  by Vercel's CDN instead of Supabase Storage.
// ------------------------------------------------------------
import catalog from "@/data/catalog.json";

type Row = Record<string, any>;
const C = catalog as unknown as {
  products: Row[];
  categories: Row[];
  flavours: Row[];
  hamper_categories: Row[];
};

const bySort = (a: Row, b: Row) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);

export function staticCategories(): Row[] {
  return C.categories.filter((c) => c.is_active).sort(bySort);
}

export function staticCategoryBySlug(slug: string): Row | null {
  return C.categories.find((c) => c.slug === slug && c.is_active) ?? null;
}

export function staticCustomiseImg(): string | null {
  return C.categories.find((c) => c.slug === "customise-your-cake")?.image_url ?? null;
}

/** Active products, joined with their category like `categories(name,is_active)`. */
export function staticProducts(): Row[] {
  const cats = new Map(C.categories.map((c) => [c.id, c]));
  return C.products
    .filter((p) => p.is_active)
    .sort(bySort)
    .map((p) => {
      const c = cats.get(p.category_id);
      return { ...p, categories: c ? { name: c.name, is_active: c.is_active, slug: c.slug } : null };
    });
}

export function staticProductsInCategory(categoryId: string): Row[] {
  return C.products.filter((p) => p.is_active && p.category_id === categoryId).sort(bySort);
}

export function staticFlavours(): Row[] {
  return C.flavours
    .filter((f) => f.is_active)
    .sort((a, b) => String(a.menu).localeCompare(String(b.menu)) || bySort(a, b))
    .map(({ name, menu, surcharge, addon_15, addon_2 }) => ({ name, menu, surcharge, addon_15, addon_2 }));
}
