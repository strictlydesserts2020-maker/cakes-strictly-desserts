import type { Metadata } from "next";
import Link from "next/link";
import { waLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Celebration Cake Package in Chennai | Strictly Desserts",
  description:
    "Complete celebration dessert packages in Anna Nagar, Chennai \u2014 a customised cake with cupcakes, cheesecake cups, macarons and more, styled to your theme. From \u20B96,000.",
  alternates: { canonical: "/cakes/celebration-package" },
  openGraph: {
    title: "Celebration Cake Package | Strictly Desserts",
    description: "A complete dessert spread for your big day \u2014 customised to your theme.",
    url: "https://www.strictlydesserts.in/cakes/celebration-package",
    type: "website",
    images: [{ url: "https://www.strictlydesserts.in/celebration/unicorn.webp" }],
  },
};

const GRAD = "linear-gradient(135deg,#D4714A,#9E4A1E)";

const GALLERY = [
  { src: "/celebration/unicorn.webp", alt: "Unicorn theme celebration dessert table" },
  { src: "/celebration/jungle.webp", alt: "Jungle safari birthday cake and treats" },
  { src: "/celebration/superhero.webp", alt: "Superhero theme cake with cupcakes and cookies" },
  { src: "/celebration/mermaid.webp", alt: "Mermaid theme celebration cake and desserts" },
];

const PACKAGES = [
  { price: "6,000", name: "Mini Celebration", items: ["1 kg Mini Tier Cake", "10 Cupcakes", "10 Cheesecake Cups", "1 Customised Topper"], feat: false },
  { price: "10,000", name: "Signature Celebration", items: ["2 kg Mini Tier Cake", "10 Cupcakes", "10 Cheesecake Cups", "10 Cakesicles / Sugar Cookies", "1 Customised Topper"], feat: false },
  { price: "13,500", name: "Grand Celebration", items: ["3 kg Customised Cake", "10 Cupcakes", "10 Cheesecake Cups", "10 Macarons", "10 Cakesicles", "1 Customised Topper"], feat: true },
];

export default function CelebrationPackagePage() {
  const wa = waLink("Hi Strictly Desserts! I'd like to know more about the Celebration Cake Packages.");
  return (
    <section className="block">
      <div className="container">
        <nav style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: "1rem" }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link> <span> / </span> <span>Celebration Cake Package</span>
        </nav>

        <header style={{ textAlign: "center", marginBottom: "1.6rem" }}>
          <span style={{ color: "var(--gold)", fontWeight: 700, letterSpacing: ".2em", fontSize: ".72rem", textTransform: "uppercase" }}>— Curated for celebrations —</span>
          <h1 style={{ fontFamily: "var(--font-d)", fontWeight: 500, fontSize: "clamp(2.1rem,5vw,3.3rem)", color: "var(--cream)", margin: ".45rem 0 .4rem" }}>
            Celebration Cake <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Package</em>
          </h1>
          <p style={{ color: "var(--cream2)", maxWidth: 620, margin: "0 auto", lineHeight: 1.7 }}>
            A complete dessert spread for your big day — a show-stopping cake with cupcakes, cheesecake cups and sweet little extras, all customised to your theme.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "2.4rem" }}>
          {GALLERY.map((g) => (
            <figure key={g.src} style={{ margin: 0, borderRadius: "22px", overflow: "hidden", border: "5px solid #fff", boxShadow: "var(--shadow)", aspectRatio: "1 / 1" }}>
              <img src={g.src} alt={g.alt} width={640} height={640} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </figure>
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
          <h2 style={{ fontFamily: "var(--font-d)", fontWeight: 500, fontSize: "clamp(1.7rem,4vw,2.4rem)", color: "var(--cream)" }}>Choose Your <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Package</em></h2>
          <p style={{ color: "var(--cream2)", marginTop: ".3rem" }}>Three curated spreads — customised to your theme, colours and headcount.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "1.4rem" }}>
          {PACKAGES.map((p) => (
            <article key={p.price} style={{ position: "relative", background: "var(--surface)", border: p.feat ? "1.5px solid #E6C3A8" : "1px solid var(--border)", borderRadius: "28px", padding: "2rem 1.7rem", boxShadow: p.feat ? "var(--shadow-lg)" : "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
              {p.feat ? (
                <span style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", background: GRAD, color: "#fff", fontSize: ".66rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", padding: ".42rem 1rem", borderRadius: "999px" }}>Most Loved</span>
              ) : null}
              <div style={{ fontFamily: "var(--font-d)", fontWeight: 600, fontSize: "2.6rem", color: "var(--gold)", lineHeight: 1 }}>
                <span style={{ fontSize: "1.4rem", verticalAlign: "super", marginRight: 2 }}>₹</span>{p.price}
              </div>
              <h3 style={{ fontFamily: "var(--font-d)", fontWeight: 500, fontSize: "1.1rem", color: "var(--cream)", margin: ".5rem 0 1.1rem" }}>{p.name}</h3>
              <ul style={{ listStyle: "none", margin: "0 0 1.6rem", padding: 0, display: "flex", flexDirection: "column", gap: ".6rem", flex: 1 }}>
                {p.items.map((it, i) => (
                  <li key={it} style={{ position: "relative", paddingLeft: "1.5rem", color: i === 0 ? "var(--cream)" : "var(--cream2)", fontWeight: i === 0 ? 600 : 400, fontSize: ".96rem", lineHeight: 1.4 }}>
                    <span style={{ position: "absolute", left: 0, top: ".4em", width: i === 0 ? 10 : 9, height: i === 0 ? 10 : 9, borderRadius: "50%", background: i === 0 ? GRAD : "var(--gold)", opacity: i === 0 ? 1 : 0.5 }} />
                    {it}
                  </li>
                ))}
              </ul>
              <a href={wa} style={{ display: "block", textAlign: "center", background: GRAD, color: "#fff", textDecoration: "none", fontWeight: 600, padding: ".85rem", borderRadius: "999px", boxShadow: "var(--shadow-gold)" }}>Enquire on WhatsApp</a>
            </article>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: ".8rem 2rem", justifyContent: "center", padding: "1.6rem 0 0", color: "var(--muted)", fontSize: ".9rem" }}>
          <span>✦ Any major custom changes may attract additional charges &amp; lead time</span>
          <span>✦ Delivery charges apply</span>
        </div>

        <section style={{ textAlign: "center", background: GRAD, borderRadius: "36px", padding: "clamp(2.2rem,5vw,3.2rem)", color: "#fff", margin: "2.6rem 0 1rem" }}>
          <h2 style={{ fontFamily: "var(--font-d)", fontWeight: 500, fontSize: "clamp(1.6rem,4vw,2.3rem)", marginBottom: ".5rem" }}>Let&rsquo;s Plan Your Celebration</h2>
          <p style={{ opacity: 0.92, maxWidth: 560, margin: "0 auto 1.4rem" }}>Tell us your date, theme and headcount and we&rsquo;ll tailor the perfect package for you.</p>
          <a href={wa} style={{ display: "inline-block", background: "#fff", color: "var(--gold)", textDecoration: "none", fontWeight: 700, padding: ".9rem 2rem", borderRadius: "999px" }}>💬 Enquire on WhatsApp</a>
        </section>
      </div>
    </section>
  );
}
