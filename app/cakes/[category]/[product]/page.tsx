import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { inr, safeImg, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SITE = "https://www.strictlydesserts.in";

function idPrefix(handle: string) {
  return handle.split("-").pop() || "";
}

async function getProduct(handle: string) {
  const prefix = idPrefix(handle);
  if (!prefix) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .ilike("id", prefix + "%")
    .eq("is_active", true)
    .limit(1);
  return (data && data[0]) || null;
}

export async function generateMetadata({ params }: { params: { category: string; product: string } }): Promise<Metadata> {
  const p: any = await getProduct(params.product);
  if (!p) return { title: "Cake | Strictly Desserts" };
  const catSlug = p.categories?.slug || params.category;
  const title = `${p.name} — ${inr(Number(p.price))} | Strictly Desserts`;
  const description =
    (p.description && String(p.description).trim()) ||
    `${p.name} — handcrafted ${(p.categories?.name || "cake").toLowerCase()} made fresh to order in Anna Nagar, Chennai. Order online or on WhatsApp from Strictly Desserts.`;
  const url = `${SITE}/cakes/${catSlug}/${params.product}`;
  const img = safeImg(p.image_url);
  return {
    title,
    description,
    alternates: { canonical: `/cakes/${catSlug}/${params.product}` },
    openGraph: { title, description, url, type: "website", images: img ? [{ url: img }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: { category: string; product: string } }) {
  const p: any = await getProduct(params.product);
  if (!p) notFound();
  const catName = p.categories?.name || "Cakes";
  const catSlug = p.categories?.slug || params.category;
  const img = safeImg(p.image_url);
  const price = Number(p.price);
  const desc =
    (p.description && String(p.description).trim()) ||
    `A handcrafted ${catName.toLowerCase()} made fresh to order. Choose your flavour, size and message — we'll bring your design to life and deliver across Chennai.`;

  const productLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: desc,
    category: catName,
    brand: { "@type": "Brand", name: "Strictly Desserts" },
    offers: {
      "@type": "Offer",
      price: String(price),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE}/cakes/${catSlug}/${params.product}`,
      seller: { "@type": "Organization", name: "Strictly Desserts" },
    },
  };
  if (img) productLd.image = [img];

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: catName, item: `${SITE}/cakes/${catSlug}` },
      { "@type": "ListItem", position: 3, name: p.name, item: `${SITE}/cakes/${catSlug}/${params.product}` },
    ],
  };

  const wa = waLink(`Hi Strictly Desserts! I'd like to order the "${p.name}" cake (${inr(price)}).`);

  return (
    <section className="block">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <div className="container">
        <nav style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: "1.2rem" }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link>
          <span> / </span>
          <Link href={`/cakes/${catSlug}`} style={{ color: "inherit" }}>{catName}</Link>
          <span> / </span>
          <span>{p.name}</span>
        </nav>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "start" }}>
          <div className="ph" style={{ borderRadius: "var(--r-lg)", overflow: "hidden", aspectRatio: "4 / 3.4" }}>
            {img ? (
              <img src={img} alt={p.name} width={900} height={765} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
          </div>
          <div>
            <p style={{ color: "var(--gold2)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: ".75rem", fontWeight: 600 }}>{catName}</p>
            <h1 style={{ fontFamily: "var(--font-d)", fontSize: "clamp(1.7rem, 3.5vw, 2.5rem)", color: "var(--cream)", margin: ".3rem 0 .5rem" }}>{p.name}</h1>
            <p style={{ fontFamily: "var(--font-d)", fontSize: "1.6rem", color: "var(--gold2)", fontWeight: 600 }}>{inr(price)}</p>
            {p.is_eggless ? <p style={{ margin: ".4rem 0" }}><span className="badge badge-veg">Eggless available</span></p> : null}
            <p style={{ color: "var(--cream2)", lineHeight: 1.7, margin: "1rem 0" }}>{desc}</p>
            <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", marginTop: "1.4rem" }}>
              <a className="btn btn-gold" href={wa} style={{ textDecoration: "none" }}>Order on WhatsApp</a>
              <Link className="btn btn-ghost" href={`/?p=${p.id}`} style={{ textDecoration: "none" }}>View &amp; customise</Link>
            </div>
            <p style={{ marginTop: "1.6rem", fontSize: ".85rem" }}>
              <Link href={`/cakes/${catSlug}`} style={{ color: "var(--gold2)" }}>← More {catName}</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
