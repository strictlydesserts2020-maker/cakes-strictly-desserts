import Link from "next/link";
import { waLink } from "@/lib/utils";

export default function CakesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem clamp(1.25rem, 4vw, 2.5rem)" }}
        >
          <Link href="/" style={{ fontFamily: "var(--font-d)", fontSize: "1.4rem", fontWeight: 600, color: "var(--cream)", textDecoration: "none" }}>
            Strictly Desserts
          </Link>
          <nav style={{ display: "flex", gap: "1.25rem", fontSize: ".9rem" }}>
            <Link href="/" style={{ color: "var(--cream2)", textDecoration: "none" }}>Home</Link>
            <Link href="/cakes/mini-tiers" style={{ color: "var(--cream2)", textDecoration: "none" }}>Mini Tiers</Link>
            <Link href="/cakes/bento-cakes" style={{ color: "var(--cream2)", textDecoration: "none" }}>Bento Cakes</Link>
          </nav>
        </div>
      </header>

      {children}

      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", marginTop: "3rem" }}>
        <div className="container" style={{ padding: "2rem clamp(1.25rem, 4vw, 2.5rem)", color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.8 }}>
          <p style={{ fontFamily: "var(--font-d)", fontSize: "1.1rem", color: "var(--cream)", marginBottom: ".4rem" }}>
            Strictly Desserts
          </p>
          <p>Handcrafted birthday, wedding, bento &amp; customised cakes baked fresh in Anna Nagar, Chennai.</p>
          <p style={{ marginTop: ".6rem" }}>
            <a href="tel:+919003082979" style={{ color: "inherit" }}>+91 90030 82979</a>
            {" · "}
            <a href={waLink("Hi Strictly Desserts! I'd like to order a cake.")} style={{ color: "inherit" }}>WhatsApp</a>
            {" · "}
            <a href="https://www.instagram.com/strictlydesserts" style={{ color: "inherit" }}>Instagram</a>
          </p>
          <p style={{ marginTop: ".6rem" }}>&copy; {new Date().getFullYear()} Strictly Desserts. Made with love in Chennai.</p>
        </div>
      </footer>
    </>
  );
}
