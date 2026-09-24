import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";
import { inr, safeImg, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SITE = "https://www.strictlydesserts.in";

function handle(p: Product) {
  return `${slugify(p.name) || "cake"}-${p.id.slice(0, 8)}`;
}

async function getData(slug: string) {
  const supabase = createClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!cat) return { cat: null as Category | null, products: [] as Product[] };
  const { data: prods } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", (cat as Category).id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return { cat: cat as Category, products: (prods ?? []) as Product[] };
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const { cat } = await getData(params.category);
  if (!cat) return { title: "Cakes | Strictly Desserts" };
  const title = `${cat.name} in Anna Nagar, Chennai | Strictly Desserts`;
  const description =
    cat.description ||
    `Order ${cat.name} handcrafted fresh in Anna Nagar, Chennai. Custom designs, premium flavours and delivery across Chennai from Strictly Desserts.`;
  const url = `${SITE}/cakes/${cat.slug}`;
  return {
    title,
    description,
    alternates: { canonical: `/cakes/${cat.slug}` },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: cat.image_url ? [{ url: safeImg(cat.image_url) }] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const { cat, products } = await getData(params.category);
  if (!cat) notFound();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: cat.name,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/cakes/${cat.slug}/${handle(p)}`,
      name: p.name,
    })),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: cat.name, item: `${SITE}/cakes/${cat.slug}` },
    ],
  };

  return (
    <section className="block">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <div className="container">
        <nav style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: "1rem" }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link>
          <span> / </span>
          <span>{cat.name}</span>
        </nav>
        <h1 style={{ fontFamily: "var(--font-d)", fontSize: "clamp(1.9rem, 4vw, 2.8rem)", color: "var(--cream)", marginBottom: ".5rem" }}>
          {cat.name} in Chennai
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 640, marginBottom: "1.4rem" }}>
          {cat.description ||
            `Handcrafted ${cat.name.toLowerCase()} made fresh to order in Anna Nagar, Chennai. ${products.length} designs to choose from — or customise your own.`}
        </p>
        {products.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            New designs coming soon. <Link href="/">Browse all cakes →</Link>
          </p>
        ) : (
          <div className="products-grid">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/cakes/${cat.slug}/${handle(p)}`}
                className="product-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="product-img">
                  <img src={safeImg(p.image_url)} alt={p.name} loading="lazy" width={700} height={525} />
                  {p.badge ? (
                    <span className="product-badge" style={{ position: "absolute", top: 12, left: 12, zIndex: 3 }}>{p.badge}</span>
                  ) : null}
                  {p.is_eggless ? (
                    <span className="badge badge-veg" style={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}>Eggless</span>
                  ) : null}
                </div>
                <div className="product-info">
                  <h2 className="product-name" style={{ fontSize: "1.05rem" }}>{p.name}</h2>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: ".5rem" }}>
                    <span className="product-price">{inr(Number(p.price))}</span>
                    <span className="btn btn-gold">View</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <p style={{ marginTop: "2rem" }}>
          <Link href="/" style={{ color: "var(--gold2)" }}>← Back to all cakes</Link>
        </p>
      </div>
    </section>
  );
}
