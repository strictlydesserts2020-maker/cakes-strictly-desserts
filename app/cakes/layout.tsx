"use client";

import Link from "next/link";
import { useState } from "react";
import { LOGO_DATA_URI } from "@/lib/brand";
import { waLink } from "@/lib/utils";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/?view=categories" },
  { label: "All Cakes", href: "/?view=shop" },
  { label: "Gift Hampers", href: "/?view=gift-hampers" },
  { label: "Delivery Process", href: "/?view=delivery-process" },
  { label: "Contact Us", href: "/?view=contact" },
];

export default function CakesLayout({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <>
      <nav className="navbar scrolled">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" onClick={() => setNavOpen(false)}>
            <img src={LOGO_DATA_URI} alt="Strictly Desserts" />
            <span className="lw">Strictly Desserts</span>
          </Link>
          <ul className={"nav-links" + (navOpen ? " open" : "")} id="navLinks">
            {NAV.map((n) => (
              <li key={n.label}>
                <Link href={n.href} onClick={() => setNavOpen(false)}>{n.label}</Link>
              </li>
            ))}
          </ul>
          <div className="nav-actions">
            <Link className="nav-icon-btn" href="/?view=shop" aria-label="Cart" style={{ position: "relative" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </Link>
            <button className="nav-toggle" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
              <span />
            </button>
          </div>
        </div>
      </nav>

      {children}

      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", marginTop: "3rem" }}>
        <div className="container" style={{ padding: "2rem clamp(1.25rem, 4vw, 2.5rem)", color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.8 }}>
          <p style={{ fontFamily: "var(--font-d)", fontSize: "1.1rem", color: "var(--cream)", marginBottom: ".4rem" }}>Strictly Desserts</p>
          <p>Handcrafted birthday, wedding, bento &amp; customised cakes baked fresh in Anna Nagar, Chennai.</p>
          <p style={{ marginTop: ".6rem" }}>
            <a href="tel:+919003082979" style={{ color: "inherit" }}>+91 90030 82979</a>
            {" \u00B7 "}
            <a href={waLink("Hi Strictly Desserts! I'd like to order a cake.")} style={{ color: "inherit" }}>WhatsApp</a>
            {" \u00B7 "}
            <a href="https://www.instagram.com/strictlydesserts" style={{ color: "inherit" }}>Instagram</a>
          </p>
          <p style={{ marginTop: ".6rem" }}>&copy; {new Date().getFullYear()} Strictly Desserts. Made with love in Chennai.</p>
        </div>
      </footer>
    </>
  );
}
