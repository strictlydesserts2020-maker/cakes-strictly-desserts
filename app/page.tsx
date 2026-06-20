import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";
import Storefront from "@/components/Storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: catRows }, { data: prodRows }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active",true).order("sort_order",{ascending:true}),
    supabase.from("products").select("*,categories(name,is_active)").eq("is_active",true).order("sort_order",{ascending:true}),
  ]);
  const categories = (catRows ?? []) as any[];
  const products = (prodRows ?? []).filter((p:any) => p.categories?.is_active !== false).map((p:any) => ({...p,category_name:p.categories?.name??""}));
  return <Storefront categories={categories} products={products} />;
}
