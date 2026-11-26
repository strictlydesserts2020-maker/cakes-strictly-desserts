import { createPublicClient } from "@/lib/supabase/public";
import type { Category, Product } from "@/lib/types";
import Storefront from "@/components/Storefront";
import { staticCategories, staticProducts, staticCustomiseImg, staticFlavours } from "@/lib/catalog";

// Cached on Vercel's CDN and refreshed every 5 minutes, so pages open instantly.
export const revalidate = 300;

export default async function HomePage() {
  const supabase = createPublicClient();
  const [{ data: catRows0, error: catErr }, { data: prodRows0, error: prodErr }, { data: custRow0 }, { data: flavRows0, error: flavErr }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("products").select("*,categories(name,is_active)").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("categories").select("image_url").eq("slug", "customise-your-cake").single(),
    supabase.from("flavours").select("name,menu,surcharge,addon_15,addon_2").eq("is_active", true).order("menu", { ascending: true }).order("sort_order", { ascending: true }),
  ]);
  // If Supabase is down/restricted, fall back to the static catalogue snapshot.
  const down = !!(catErr || prodErr || !catRows0 || !prodRows0);
  const catRows = down ? staticCategories() : catRows0;
  const prodRows = down ? staticProducts() : prodRows0;
  const custRow = down ? { image_url: staticCustomiseImg() } : custRow0;
  const flavRows = flavErr || !flavRows0 ? staticFlavours() : flavRows0;
  const categories = (catRows ?? []) as any[];
  const products = (prodRows ?? [])
    .filter((p: any) => p.categories?.is_active !== false)
    .map((p: any) => ({ ...p, category_name: p.categories?.name ?? "" }));
  const customiseImg: string | null = (custRow as any)?.image_url ?? null;
  const flavours = (flavRows ?? []) as any[];
  return <Storefront categories={categories} products={products} customiseImg={customiseImg} flavours={flavours} />;
}
