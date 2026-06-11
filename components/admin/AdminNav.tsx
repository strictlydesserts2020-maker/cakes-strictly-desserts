"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LOGO_DATA_URI } from "@/lib/brand";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/hamper-categories", label: "Hamper Categories" },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="admin-top">
      <Link href="/admin" className="brand">
        <img src={LOGO_DATA_URI} alt="logo" />
        <span>Cakes</span> Admin
      </Link>
      <nav className="admin-nav">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? "active" : ""}
          >
            {l.label}
          </Link>
        ))}
        <a href="/" target="_blank" rel="noopener">View site ↗</a>
        <a href="#" onClick={(e) => { e.preventDefault(); signOut(); }} title={email}>Sign out</a>
      </nav>
    </header>
  );
}
