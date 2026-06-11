"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Category, Product, CartItem } from "@/lib/types";
import {
  inr,
  safeImg,
  stars,
  weightOpts,
  cleanText,
  validPhone,
  validEmailOrPhone,
  FLAVOURS,
  waLink,
} from "@/lib/utils";
import { LOGO_DATA_URI } from "@/lib/brand";

type View = "home" | "shop" | "categories" | "about" | "contact" | "gift-hampers" | "delivery-process";

const NAV_LABELS: Record<string, string> = {
  home: "Home",
  categories: "Categories",
  shop: "All Cakes",
  "gift-hampers": "Gift Hampers",
  "delivery-process": "Delivery Process",
  contact: "Contact Us",
};
type Toast = { id: number; msg: string };

interface Filters {
  search: string;
  category: string;
  occasion: string;
  egg: boolean;
  min: number | null;
  max: number | null;
  sort: string;
}

const FREE = 2000;
const DEL = 60;

function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.dataset.broken = "1";
}

export default function Storefront({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const [view, setView] = useState<View>("home");
  const [scrolled, setScrolled] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; disc: number }>({ code: "", disc: 0 });
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean }>({ text: "", ok: true });
  const [orderNote, setOrderNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderErr, setOrderErr] = useState("");
  const [fulfil, setFulfil] = useState<{ mode: string; date: string; time: string; addr: string }>({
    mode: "",
    date: "",
    time: "",
    addr: "",
  });

  // filters
  const [F, setF] = useState<Filters>({
    search: "",
    category: "",
    occasion: "",
    egg: false,
    min: null,
    max: null,
    sort: "pop",
  });

  // quick view
  const [qv, setQv] = useState<{ open: boolean; product: Product | null; wIdx: number; flav: string; egg: boolean; qty: number }>(
    { open: false, product: null, wIdx: 0, flav: FLAVOURS[0], egg: false, qty: 1 }
  );

  // customise modal
  const [custOpen, setCustOpen] = useState(false);

  const notify = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  // brand loader + navbar scroll + admin deep-link hint
  useEffect(() => {
    const tmo = requestAnimationFrame(() => setLoaded(true));
    const onScroll = () => setScrolled(window.scrollY > 10 || true);
    window.addEventListener("scroll", onScroll);
    // The old #manage-sd local editor is replaced by the secured /admin dashboard.
    if (window.location.hash === "#manage-sd") {
      window.location.href = "/admin";
    }
    return () => {
      cancelAnimationFrame(tmo);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  // Lock body scroll on iOS Safari when any modal is open
  useEffect(() => {
    const anyOpen = qv.open || custOpen;
    if (anyOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const top = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (top) window.scrollTo(0, -parseInt(top || '0'));
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [qv.open, custOpen]);


  const go = useCallback((v: View) => {
    setView(v);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ---------- cart helpers ----------
  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unit * i.qty, 0), [cart]);

  const addToCart = useCallback((it: CartItem) => {
    setCart((items) => {
      const idx = items.findIndex(
        (i) => i.pid === it.pid && i.weight === it.weight && i.flavour === it.flavour && i.egg === it.egg
      );
      if (idx >= 0) {
        const copy = items.slice();
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + it.qty };
        return copy;
      }
      return [...items, it];
    });
  }, []);

  const changeQty = useCallback((idx: number, d: number) => {
    setCart((items) => {
      const copy = items.slice();
      if (!copy[idx]) return items;
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + d };
      if (copy[idx].qty < 1) copy.splice(idx, 1);
      return copy;
    });
  }, []);

  const removeAt = useCallback((idx: number) => {
    setCart((items) => items.filter((_, i) => i !== idx));
    notify("Item removed");
  }, [notify]);

  const applyCoupon = useCallback(() => {
    const v = (couponInput || "").trim().toUpperCase();
    if (v === "SWEET10") {
      setCoupon({ code: v, disc: Math.round(subtotal * 0.1) });
      setCouponMsg({ text: "\u2713 10% off applied!", ok: true });
    } else if (v === "FREESHIP") {
      setCoupon({ code: v, disc: 0 });
      setCouponMsg({ text: "\u2713 Free shipping applied!", ok: true });
    } else {
      setCoupon({ code: "", disc: 0 });
      setCouponMsg({ text: "\u2717 Invalid code (try SWEET10)", ok: false });
    }
  }, [couponInput, subtotal]);

  const del = fulfil.mode === "pickup" ? 0 : subtotal >= FREE ? 0 : DEL;
  const total = subtotal + del - coupon.disc;

  const placeOrder = useCallback(() => {
    if (!cart.length) {
      notify("Your cart is empty");
      return;
    }
    if (!fulfil.mode) {
      notify("Please choose Pickup or Delivery");
      setDrawerOpen(true);
      return;
    }
    if (fulfil.mode === "delivery" && !fulfil.addr.trim()) {
      notify("Please enter your delivery address");
      setDrawerOpen(true);
      return;
    }
    if (!fulfil.date || !fulfil.time) {
      notify("Please choose a date and time");
      setDrawerOpen(true);
      return;
    }
    if (!customerName.trim()) {
      setOrderErr("Please enter your name.");
      setDrawerOpen(true);
      return;
    }
    if (!validPhone(customerPhone)) {
      setOrderErr("Please enter a valid 10-digit phone number.");
      setDrawerOpen(true);
      return;
    }
    setOrderErr("");
    const fmtDate = (d: string) => {
      const p = d.split("-");
      return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };
    const fmtTime = (t: string) => {
      const p = t.split(":");
      let h = parseInt(p[0], 10);
      const ap = h >= 12 ? "PM" : "AM";
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      return h12 + ":" + p[1] + " " + ap;
    };
    const L: string[] = [];
    L.push("Hi Strictly Desserts! I'd like to place an order:");
    L.push("");
    cart.forEach((it) =>
      L.push(
        "\u2022 " +
          it.qty +
          " x " +
          it.name +
          " (" +
          it.weight +
          ", " +
          it.flavour +
          (it.egg ? ", Eggless" : "") +
          ") \u2014 " +
          inr(it.unit * it.qty)
      )
    );
    L.push("");
    L.push("Subtotal: " + inr(subtotal));
    L.push((fulfil.mode === "pickup" ? "Pickup: " : "Delivery: ") + (del === 0 ? "FREE" : inr(del)));
    if (coupon.disc > 0) L.push("Coupon (" + coupon.code + "): -" + inr(coupon.disc));
    L.push("Total: " + inr(total));
    L.push("");
    if (fulfil.mode === "pickup") {
      L.push("\uD83C\uDFEC Pickup");
    } else {
      L.push("\uD83D\uDEF5 Delivery");
      L.push("Address: " + fulfil.addr.trim());
    }
    L.push("Date: " + fmtDate(fulfil.date));
    L.push("Time: " + fmtTime(fulfil.time));
    L.push("");
    L.push("Name: " + customerName.trim());
    L.push("Phone: " + customerPhone.trim());
    if (orderNote.trim()) {
      L.push("");
      L.push("Special instructions: " + orderNote.trim());
    }
    window.open(waLink(L.join("\n")), "_blank", "noopener");
    notify("Opening WhatsApp to confirm your order \uD83C\uDF82");
    setCart([]);
    setCoupon({ code: "", disc: 0 });
    setCouponInput("");
    setOrderNote("");
    setCustomerName("");
    setCustomerPhone("");
    setOrderErr("");
    setFulfil({ mode: "", date: "", time: "", addr: "" });
    setDrawerOpen(false);
  }, [cart, fulfil, subtotal, del, coupon, total, orderNote, customerName, customerPhone, notify]);

  // ---------- quick view ----------
  const openQuick = useCallback((p: Product) => {
    setQv({ open: true, product: p, wIdx: 0, flav: FLAVOURS[0], egg: p.is_eggless, qty: 1 });
  }, []);

  const qvUnit = useMemo(() => {
    if (!qv.product) return 0;
    const wo = weightOpts(qv.product.category_name);
    return Math.round(Number(qv.product.price) * wo[qv.wIdx].m);
  }, [qv]);

  const qvAdd = useCallback(() => {
    if (!qv.product) return;
    const wo = weightOpts(qv.product.category_name);
    addToCart({
      pid: qv.product.id,
      name: qv.product.name,
      img: safeImg(qv.product.image_url),
      weight: wo[qv.wIdx].l,
      flavour: qv.flav,
      egg: qv.egg,
      unit: qvUnit,
      qty: qv.qty,
    });
    setQv((s) => ({ ...s, open: false }));
    setDrawerOpen(true);
    notify("Added to cart \uD83C\uDF70");
  }, [qv, qvUnit, addToCart, notify]);

  // ---------- filters / shop ----------
  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const cat = p.category_name || "";
      if (
        F.search &&
        p.name.toLowerCase().indexOf(F.search.toLowerCase()) < 0 &&
        cat.toLowerCase().indexOf(F.search.toLowerCase()) < 0
      )
        return false;
      if (F.category && cat.toLowerCase() !== F.category.toLowerCase()) return false;
      if (F.occasion && (p.occasions || []).indexOf(F.occasion) < 0) return false;
      if (F.egg && !p.is_eggless) return false;
      if (F.min != null && Number(p.price) < F.min) return false;
      if (F.max != null && Number(p.price) > F.max) return false;
      return true;
    });
    if (F.sort === "price_asc") list = list.slice().sort((a, b) => Number(a.price) - Number(b.price));
    else if (F.sort === "price_desc") list = list.slice().sort((a, b) => Number(b.price) - Number(a.price));
    else if (F.sort === "rating") list = list.slice().sort((a, b) => Number(b.rating) - Number(a.rating));
    return list;
  }, [products, F]);

  const featured = useMemo(() => products.slice(0, 6), [products]);

  const activeTags = useMemo(() => {
    const tags: [string, string][] = [];
    if (F.category) tags.push(["Category: " + F.category, "category"]);
    if (F.occasion) tags.push(["Occasion: " + F.occasion, "occasion"]);
    if (F.egg) tags.push(["Eggless", "egg"]);
    if (F.search) tags.push(['Search: "' + F.search + '"', "search"]);
    if (F.min != null || F.max != null)
      tags.push(["Price " + inr(F.min || 0) + "\u2013" + (F.max != null ? inr(F.max) : "\u221E"), "price"]);
    return tags;
  }, [F]);

  const clearTag = (k: string) =>
    setF((f) => {
      const n = { ...f };
      if (k === "price") {
        n.min = null;
        n.max = null;
      } else if (k === "search") n.search = "";
      else if (k === "egg") n.egg = false;
      else if (k === "category") n.category = "";
      else if (k === "occasion") n.occasion = "";
      return n;
    });

  const goCategory = (name: string) => {
    setF({ search: "", category: name, occasion: "", egg: false, min: null, max: null, sort: F.sort });
    go("shop");
  };

  // ---------- product card ----------
  const ProductCard = ({ p }: { p: Product }) => (
    <div className="product-card" data-pid={p.id}>
      <div className="product-img" onClick={() => openQuick(p)} style={{ cursor: "pointer" }}>
        <img
          src={safeImg(p.image_url)}
          alt={p.name}
          loading="lazy"
          decoding="async"
          width={700}
          height={525}
          onError={onImgError}
        />
        {p.badge ? (
          <span className="product-badge" style={{ position: "absolute", top: 12, left: 12, zIndex: 3 }}>
            {p.badge}
          </span>
        ) : null}
        {p.is_eggless ? (
          <span className="badge badge-veg" style={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}>
            Eggless
          </span>
        ) : null}
      </div>
      <div className="product-info">
        <h3 className="product-name">{p.name}</h3>
        <div className="p-rating" aria-label={`Rated ${Number(p.rating).toFixed(1)} out of 5`}>
          {stars(Number(p.rating))} <span style={{ color: "var(--muted)" }}>{Number(p.rating).toFixed(1)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: ".5rem" }}>
          <span className="product-price">{inr(Number(p.price))}</span>
          <button className="btn btn-gold add-btn" onClick={() => openQuick(p)} aria-label={`Add ${p.name} to cart`}>
            Add +
          </button>
        </div>
      </div>
    </div>
  );

  const viewClass = (v: View) => "view" + (view === v ? " active view-anim" : "");

  return (
    <>
      {/* BRAND LOADER */}
      <div id="brandLoader" className={loaded ? "hide" : ""}>
        <img src={LOGO_DATA_URI} alt="Strictly Desserts" />
        <div className="ld-bar">
          <i />
        </div>
        <div className="ld-text">Plating something sweet…</div>
      </div>

      {/* NAVBAR */}
      <nav className={"navbar" + (scrolled ? " scrolled" : "")}>
        <div className="nav-inner">
          <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); go("home"); }}>
            <img src={LOGO_DATA_URI} alt="logo" />
            <span className="lw">
              Strictly Desserts
            </span>
          </a>
          <ul className={"nav-links" + (navOpen ? " open" : "")} id="navLinks">
            {(["home", "categories", "shop", "gift-hampers", "delivery-process", "contact"] as View[]).map((v) => (
              <li key={v}>
                <a
                  href="#"
                  className={view === v ? "active" : ""}
                  onClick={(e) => { e.preventDefault(); go(v); }}
                >
                  {NAV_LABELS[v] ?? v[0].toUpperCase() + v.slice(1)}
                </a>
              </li>
            ))}
          </ul>
          <div className="nav-actions">
            <button className="nav-icon-btn" onClick={() => setDrawerOpen(true)} style={{ position: "relative" }} aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="cart-count" style={{ display: cartCount > 0 ? "flex" : "none" }}>
                {cartCount}
              </span>
            </button>
            <a href="#" className="btn-nav-login" onClick={(e) => { e.preventDefault(); go("contact"); }}>
              Order Now
            </a>
            <button className="nav-toggle" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* HOME */}
      <div className={viewClass("home")}>
        <section className="block">
          <div className="container">
            <div className="center" style={{ marginBottom: "2rem" }}>
              <span className="section-eyebrow eyebrow-c">Find your perfect cake</span>
              <h2 className="sec-title">Shop by <em>Category</em></h2>
            </div>
            <div className="cat-strip">
              {categories.map((c) => (
                <div key={c.id} className="cat-tile" onClick={() => goCategory(c.name)}>
                  <div className="ph">
                    <img src={safeImg(c.image_url)} alt={c.name} loading="lazy" decoding="async" onError={onImgError} />
                  </div>
                  <span className="label">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="block" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="center" style={{ marginBottom: "2rem" }}>
              <h2 className="sec-title">Best Seller <em>Designs</em></h2>
            </div>
            <div className="products-grid">
              {featured.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
            <div className="center" style={{ marginTop: "2.5rem" }}>
              <button className="btn btn-ghost btn-lg" onClick={() => go("shop")}>View All Cakes →</button>
            </div>
          </div>
        </section>

        {/* HOW TO ORDER */}
        <section className="block hto-section" style={{ padding: "1.8rem 0 1.5rem" }}>
          <div className="container">
            <div className="center" style={{ marginBottom: "2.8rem" }}>
              <span className="section-eyebrow eyebrow-c">Simple &amp; Easy</span>
              <h2 className="sec-title">How to <em>Order</em></h2>
            </div>
            <div className="hto-steps">
              <div className="hto-step">
                <div className="hto-icon">🎂</div>
                <div className="hto-num">1</div>
                <h4>Choose Design</h4>
                <p>Browse our collection or share your own inspiration photo</p>
              </div>
              <div className="hto-arrow">→</div>
              <div className="hto-step">
                <div className="hto-icon">📋</div>
                <div className="hto-num">2</div>
                <h4>Share Details</h4>
                <p>Tell us the flavour, size, message &amp; your delivery date</p>
              </div>
              <div className="hto-arrow">→</div>
              <div className="hto-step">
                <div className="hto-icon">✅</div>
                <div className="hto-num">3</div>
                <h4>Confirm Order</h4>
                <p>We confirm availability &amp; begin crafting your cake</p>
              </div>
              <div className="hto-arrow">→</div>
              <div className="hto-step">
                <div className="hto-icon">🚚</div>
                <div className="hto-num">4</div>
                <h4>Delivered Fresh</h4>
                <p>Freshly made &amp; delivered right to your door across Chennai</p>
              </div>
            </div>
          </div>
        </section>

        {/* EVERYTHING YOU NEED */}
        <section className="block eyn-section" style={{ padding: "2.5rem 0 1.5rem" }}>
          <div className="container">
            <div className="center" style={{ marginBottom: "2rem" }}>
              <h2 className="sec-title">Everything You Need for a <em>Perfect Cake</em></h2>
            </div>
            <div className="eyn-grid">
              <div className="eyn-card">
                <span className="eyn-emoji">🚚</span>
                <div>
                  <h4>Doorstep Delivery Across Chennai</h4>
                  <p>We deliver fresh to your door — on time, every time.</p>
                </div>
              </div>
              <div className="eyn-card">
                <span className="eyn-emoji">🎂</span>
                <div>
                  <h4>Buttercream That Isn't Too Sweet</h4>
                  <p>Light, balanced frosting — indulgent without the sugar rush.</p>
                </div>
              </div>
              <div className="eyn-card">
                <span className="eyn-emoji">🍓</span>
                <div>
                  <h4>Signature Dessert-Inspired Flavours</h4>
                  <p>Unique flavour profiles inspired by our favourite desserts.</p>
                </div>
              </div>
              <div className="eyn-card">
                <span className="eyn-emoji">🎨</span>
                <div>
                  <h4>Pinterest To Reality Designs</h4>
                  <p>Share your inspiration — we'll bring it to life, exactly as you imagined.</p>
                </div>
              </div>
              <div className="eyn-card">
                <span className="eyn-emoji">🥚</span>
                <div>
                  <h4>Eggless Options Available</h4>
                  <p>Most of our cakes come in delicious eggless variants — same taste, no compromise.</p>
                </div>
              </div>
              <div className="eyn-card">
                <span className="eyn-emoji">📦</span>
                <div>
                  <h4>From Bento Cakes To Tiered Showstoppers</h4>
                  <p>Whether it's an intimate celebration or a grand event, we've got you covered.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GOOGLE REVIEWS MARQUEE */}
        <section className="block reviews-section" style={{ padding: "1.5rem 0 2rem" }}>
          <div className="container">
            <div className="center" style={{ marginBottom: "1.8rem" }}>
              <span className="section-eyebrow eyebrow-c">Real Customers · Google Reviews</span>
              <h2 className="sec-title">What Our <em>Customers</em> Say</h2>
            </div>
          </div>
          <div className="marquee-wrap">
            <div className="marquee-track">
              {/* 8 reviews × 2 for seamless loop */}
              {[
                { name: "Umar Mohammed", review: "Thank you so much for the beautiful, custom cake! The design was exquisite and matched our theme perfectly. Everyone was in awe and it made our celebration so memorable. We will definitely be back like forever. 🥳🎂😍" },
                { name: "Swathi Raju", review: "I ordered a vintage butterscotch cake and it was absolutely amazing. The buttercream was luscious, very tasty, and truly indulgent. The three-tiered vintage design was stunning. One of the best dessert experiences I've had so far!" },
                { name: "Bernadette Sheeba", review: "We ordered a customized mini three tiered 1kg cake and the customisation exceeded our expectations!! The cake was yum 😋 as usual 😍❤️ Thank you for the timely delivery 🙌✨" },
                { name: "Grace Nungsihring", review: "Heartfelt thanks for the beautiful cake for Shiloh's 1st birthday. Everything was just perfect! It was definitely worth the 18 kilometres we drove — no regrets at all! 😍" },
                { name: "Natesh Nandhini", review: "Birthday cake order — got 100% accurate ordered design and the taste was so good. Absolutely loved it!" },
                { name: "Amirthavarshini S.", review: "I ordered 3 bento cakes — vanilla with strawberry, chunky Nutella, vanilla with blueberry. Absolutely delicious! Light on stomach, balanced flavours and we loved every bite of it!" },
                { name: "Janet Vincent", review: "Thank you for the two tasty bento cakes. I gave a Pinterest reference in a short time, they delivered on time and it was exactly as I imagined. Definitely ordering more from you!" },
                { name: "Saranya Saran", review: "I ordered Opera cake from Strictly Desserts — it was awesome 😍. Tried their ice cream too, especially Salted Caramel and Rose Milk — top notch! Highly recommended for any occasion. Keep up the great work! 😍" },
              ].concat([
                { name: "Umar Mohammed", review: "Thank you so much for the beautiful, custom cake! The design was exquisite and matched our theme perfectly. Everyone was in awe and it made our celebration so memorable. We will definitely be back like forever. 🥳🎂😍" },
                { name: "Swathi Raju", review: "I ordered a vintage butterscotch cake and it was absolutely amazing. The buttercream was luscious, very tasty, and truly indulgent. The three-tiered vintage design was stunning. One of the best dessert experiences I've had so far!" },
                { name: "Bernadette Sheeba", review: "We ordered a customized mini three tiered 1kg cake and the customisation exceeded our expectations!! The cake was yum 😋 as usual 😍❤️ Thank you for the timely delivery 🙌✨" },
                { name: "Grace Nungsihring", review: "Heartfelt thanks for the beautiful cake for Shiloh's 1st birthday. Everything was just perfect! It was definitely worth the 18 kilometres we drove — no regrets at all! 😍" },
                { name: "Natesh Nandhini", review: "Birthday cake order — got 100% accurate ordered design and the taste was so good. Absolutely loved it!" },
                { name: "Amirthavarshini S.", review: "I ordered 3 bento cakes — vanilla with strawberry, chunky Nutella, vanilla with blueberry. Absolutely delicious! Light on stomach, balanced flavours and we loved every bite of it!" },
                { name: "Janet Vincent", review: "Thank you for the two tasty bento cakes. I gave a Pinterest reference in a short time, they delivered on time and it was exactly as I imagined. Definitely ordering more from you!" },
                { name: "Saranya Saran", review: "I ordered Opera cake from Strictly Desserts — it was awesome 😍. Tried their ice cream too, especially Salted Caramel and Rose Milk — top notch! Highly recommended for any occasion. Keep up the great work! 😍" },
              ]).map((r, i) => (
                <div className="rev-card" key={i}>
                  <div className="rev-stars">★★★★★</div>
                  <p className="rev-text">&ldquo;{r.review}&rdquo;</p>
                  <div className="rev-name">— {r.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GIFT HAMPERS BANNER */}
        <section className="block hamper-banner-section" style={{ padding: "1.2rem 0" }}>
          <div className="container">
            <div className="hamper-banner">
              <div className="hamper-banner-badge">🎁 Gift Hampers</div>
              <h2 className="hamper-banner-title">Gifts, Favours &amp; Hampers<br /><em>Made Easy</em></h2>
              <p className="hamper-banner-desc">Celebrating a new arrival, planning a birthday, organising a corporate event or preparing festive gifting? Let us create thoughtfully curated hampers and edible gifts your guests will remember.</p>
              <div className="hamper-banner-tags">
                <span>🎂 Birthdays</span>
                <span>💼 Corporate Gifting</span>
                <span>🎉 Festive Hampers</span>
                <span>👶 Baby Showers</span>
              </div>
              <button className="btn hamper-banner-btn" onClick={() => go("gift-hampers")}>
                Let&apos;s Create Something Special →
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* SHOP */}
      <div className={viewClass("shop")}>
        <div className="container">
          <div className="page-head">
            <span className="section-eyebrow eyebrow-c">Handcrafted in Chennai</span>
            <h1>Our <em>Collection</em></h1>
            <p>Bento · Birthday · Wedding · Custom — every one made to order</p>
          </div>
          <div className="shop-layout">
            <aside className="sidebar">
              <div className="sb-sec">
                <span className="sb-title">Search</span>
                <div className="search-wrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search cakes..."
                    value={F.search}
                    onChange={(e) => setF((f) => ({ ...f, search: e.target.value }))}
                  />
                </div>
              </div>
              <div className="sb-sec">
                <span className="sb-title">Category</span>
                <div className="filter-chips">
                  {categories.map((c) => (
                    <span
                      key={c.id}
                      className={"chip" + (F.category === c.name ? " active" : "")}
                      role="button"
                      tabIndex={0}
                      onClick={() => setF((f) => ({ ...f, category: f.category === c.name ? "" : c.name }))}
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sb-sec">
                <span className="sb-title">Occasion</span>
                <div className="filter-chips">
                  {["Birthday", "Anniversary", "Wedding", "Baby Shower"].map((o) => (
                    <span
                      key={o}
                      className={"chip" + (F.occasion === o ? " active" : "")}
                      role="button"
                      tabIndex={0}
                      onClick={() => setF((f) => ({ ...f, occasion: f.occasion === o ? "" : o }))}
                    >
                      {o}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sb-sec">
                <span className="sb-title">Dietary</span>
                <div className="filter-chips">
                  <span
                    className={"chip" + (F.egg ? " active" : "")}
                    role="button"
                    tabIndex={0}
                    onClick={() => setF((f) => ({ ...f, egg: !f.egg }))}
                  >
                    🌱 Eggless Only
                  </span>
                </div>
              </div>
              <div className="sb-sec">
                <span className="sb-title">Price Range (₹)</span>
                <div className="price-range">
                  <input
                    type="number"
                    placeholder="Min"
                    min={0}
                    value={F.min ?? ""}
                    onChange={(e) => setF((f) => ({ ...f, min: e.target.value ? parseInt(e.target.value, 10) : null }))}
                  />
                  <span>–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    min={0}
                    value={F.max ?? ""}
                    onChange={(e) => setF((f) => ({ ...f, max: e.target.value ? parseInt(e.target.value, 10) : null }))}
                  />
                </div>
              </div>
              <button
                className="clear-filters"
                onClick={() => setF({ search: "", category: "", occasion: "", egg: false, min: null, max: null, sort: F.sort })}
              >
                ✕ Clear All Filters
              </button>
            </aside>
            <div className="shop-main">
              <div className="sort-bar">
                <span className="result-count">
                  <b>{filtered.length}</b> cake{filtered.length === 1 ? "" : "s"} found
                </span>
                <select className="sort-select" value={F.sort} onChange={(e) => setF((f) => ({ ...f, sort: e.target.value }))}>
                  <option value="pop">Most Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
              <div className="active-filters">
                {activeTags.map(([label, k]) => (
                  <span className="active-tag" key={k}>
                    {label} <button onClick={() => clearTag(k)} aria-label="Clear filter">×</button>
                  </span>
                ))}
              </div>
              <div className="products-grid">
                {/* Customise Your Cake — always first */}
                <article className="ccard cust-tile" onClick={() => setCustOpen(true)}>
                  <div className="ph cust-ph"><span className="cust-q">?</span></div>
                  <div className="body">
                    <h3>Customise Your Cake</h3>
                    <p>Don&apos;t see what you want? Design your own cake from scratch — any category, any flavour.</p>
                    <span className="go">
                      Start customising{" "}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </div>
                </article>
                {filtered.length ? (
                  filtered.map((p) => <ProductCard key={p.id} p={p} />)
                ) : (
                  <div className="no-results">
                    <div className="i"><img src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=120&h=120&q=60" alt="No cakes" style={{width:"80px",height:"80px",objectFit:"cover",borderRadius:"50%",margin:"0 auto"}} /></div>
                    <p>No cakes match your filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className={viewClass("categories")}>
        <div className="container">
          <div className="page-head">
            <span className="section-eyebrow eyebrow-c">Find your perfect cake</span>
            <h1>Shop by <em>Category</em></h1>
            <p>Pick a category to explore every cake in that collection.</p>
          </div>
          <div className="cat-grid">
            {/* Customise Your Cake tile (first) */}
            <article className="ccard cust-tile" onClick={() => setCustOpen(true)}>
              <div className="ph cust-ph"><span className="cust-q">?</span></div>
              <div className="body">
                <h3>Customise Your Cake</h3>
                <p>Don&apos;t see what you want? Design your own cake from scratch — any category, any flavour.</p>
                <span className="go">
                  Start customising{" "}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </div>
            </article>
            {categories.map((c) => (
              <article key={c.id} className="ccard" onClick={() => goCategory(c.name)}>
                <div className="ph">
                  <img src={safeImg(c.image_url)} alt={c.name} loading="lazy" decoding="async" onError={onImgError} />
                </div>
                <div className="body">
                  <h3>{c.name}</h3>
                  <p>{c.description || ""}</p>
                  <span className="go">
                    View cakes{" "}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ABOUT */}
      <div className={viewClass("about")}>
        <div className="container">
          <div className="page-head">
            <span className="section-eyebrow eyebrow-c">Our Story</span>
            <h1>About <em>Strictly Desserts</em></h1>
          </div>
          <div className="about-grid" style={{ paddingBottom: "5rem" }}>
            <div className="ph">
              <img src="https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=72" onError={onImgError} loading="lazy" decoding="async" alt="" />
            </div>
            <div>
              <h2 className="sec-title">Baked with love, <em>finished by hand</em></h2>
              <p>Strictly Desserts began with a simple belief — that every celebration deserves a centrepiece as special as the moment itself. From our Chennai studio, we craft fresh, made-to-order cakes using premium ingredients and real fresh cream.</p>
              <p>Whether it&apos;s a bento cake for two or a towering wedding showpiece, every order is handmade, never mass-produced. We&apos;re now opening our very own café in Anna Nagar — a home for everything we love about dessert.</p>
              <button className="btn btn-gold" style={{ marginTop: "1.4rem" }} onClick={() => go("shop")}>Explore the Cakes</button>
            </div>
          </div>
        </div>
      </div>


      {/* GIFT HAMPERS */}
      <div className={viewClass("gift-hampers")}>
        <GiftHampersPage go={go} waLink={waLink} />
      </div>

      {/* DELIVERY PROCESS */}
      <div className={viewClass("delivery-process")}>
        <DeliveryProcessPage go={go} waLink={waLink} />
      </div>

      {/* CONTACT */}
      <div className={viewClass("contact")}>
        <div className="container">
          <div className="page-head">
            <span className="section-eyebrow eyebrow-c">Get in touch</span>
            <h1>Order or <em>Enquire</em></h1>
          </div>
          <ContactSection notify={notify} />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src={LOGO_DATA_URI} alt="logo" />
              <p>Handcrafted cakes &amp; luxury desserts, baked fresh in Chennai and styled to make every celebration unforgettable.</p>
            </div>
            <div className="footer-col">
              <h4>Explore</h4>
              <ul>
                <li><a href="#" onClick={(e) => { e.preventDefault(); go("home"); }}>Home</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); go("categories"); }}>Categories</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); go("shop"); }}>All Cakes</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#" onClick={(e) => { e.preventDefault(); go("gift-hampers"); }}>Gift Hampers</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); go("delivery-process"); }}>Delivery Process</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); go("contact"); }}>Contact Us</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Stay in touch</h4>
              <p style={{ color: "#B5A299", fontSize: ".86rem", marginBottom: "1rem" }}>Follow the latest bakes &amp; launches.</p>
              <div className="footer-social">
                <a href="https://www.instagram.com/strictlydesserts" target="_blank" rel="noopener" aria-label="Instagram">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                </a>
                <a href={waLink("Hi Strictly Desserts!")} target="_blank" rel="noopener" aria-label="WhatsApp">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5z" /></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Strictly Desserts. Made with love in Chennai.</span>
            <span>Privacy · Terms · Refunds</span>
          </div>
        </div>
      </footer>

      {/* WHATSAPP FAB */}
      <a className="wa-fab" href={waLink("Hi Strictly Desserts! I'd like to enquire about a cake.")} target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.59-.9-2.18-.24-.57-.48-.5-.66-.5-.17-.01-.37-.01-.57-.01s-.52.07-.79.37c-.27.3-1.04 1.01-1.04 2.46s1.06 2.86 1.21 3.06c.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.74-.71 1.99-1.4.24-.69.24-1.28.17-1.4-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.42 9.42 0 0 1-1.45-5.03c0-5.21 4.25-9.46 9.47-9.46 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.69c0 5.22-4.25 9.46-9.46 9.46zm8.06-17.52A11.36 11.36 0 0 0 12.04.5C5.78.5.69 5.59.69 11.85c0 2.09.55 4.13 1.59 5.93L.6 23.5l5.86-1.54a11.3 11.3 0 0 0 5.57 1.42h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.33-8.03z" />
        </svg>
        <span className="wa-label">Chat with us</span>
      </a>

      {/* CART DRAWER */}
      <div className={"drawer-overlay" + (drawerOpen ? " open" : "")} onClick={() => setDrawerOpen(false)} />
      <aside className={"drawer" + (drawerOpen ? " open" : "")}>
        <div className="drawer-head">
          <h3>Your Cart</h3>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
        </div>
        <div className="drawer-body">
          {!cart.length ? (
            <div className="empty-cart-d">
              <img src={LOGO_DATA_URI} alt="" width={72} height={72} />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cart.map((it, i) => (
              <div className="citem" key={i}>
                <div className="ph">
                  <img src={safeImg(it.img)} alt={it.name} loading="lazy" onError={onImgError} />
                </div>
                <div>
                  <div className="nm">{it.name}</div>
                  <div className="mt">{it.weight} · {it.flavour}{it.egg ? " · Eggless" : ""}</div>
                  <div className="qc">
                    <button onClick={() => changeQty(i, -1)} aria-label="Decrease quantity">−</button>
                    <span>{it.qty}</span>
                    <button onClick={() => changeQty(i, 1)} aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <div>
                  <div className="pr">{inr(it.unit * it.qty)}</div>
                  <button className="rmv" onClick={() => removeAt(i)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="drawer-foot">
            <div className="sum-row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
            {fulfil.mode === "pickup" ? (
              <div className="sum-row free"><span>Pickup</span><span>FREE</span></div>
            ) : del === 0 ? (
              <div className="sum-row free"><span>Delivery</span><span>FREE</span></div>
            ) : (
              <div className="sum-row"><span>Delivery</span><span>{inr(del)}</span></div>
            )}
            {coupon.disc > 0 && (
              <div className="sum-row free"><span>Coupon ({coupon.code})</span><span>−{inr(coupon.disc)}</span></div>
            )}
            {fulfil.mode !== "pickup" && subtotal > 0 && subtotal < FREE && (
              <div className="dbar">
                Add {inr(FREE - subtotal)} more for free delivery
                <div className="trk"><div className="fil" style={{ width: Math.min((subtotal / FREE) * 100, 100) + "%" }} /></div>
              </div>
            )}
            <div className="coupon-row">
              <input className="coupon-input" placeholder="Promo code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
              <button className="coupon-btn" onClick={applyCoupon}>Apply</button>
            </div>
            {couponMsg.text && (
              <div style={{ fontSize: ".74rem", minHeight: "1em", marginBottom: ".3rem", color: couponMsg.ok ? "#5aa46e" : "var(--rose)" }}>
                {couponMsg.text}
              </div>
            )}
            <div className="fulfil-row" style={{ margin: ".5rem 0 .2rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-b)", fontSize: ".74rem", fontWeight: 600, color: "var(--cream2)", marginBottom: ".4rem" }}>
                How would you like your order?
              </label>
              <div style={{ display: "flex", gap: ".5rem", marginBottom: ".55rem" }}>
                {(["pickup", "delivery"] as const).map((m) => {
                  const on = fulfil.mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFulfil((f) => ({ ...f, mode: f.mode === m ? "" : m }))}
                      style={{
                        flex: 1, padding: ".55rem",
                        border: "1px solid " + (on ? "transparent" : "var(--border2)"),
                        borderRadius: 100, fontFamily: "var(--font-b)", fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
                        background: on ? "var(--gold-grad)" : "var(--surface)", color: on ? "#fff" : "var(--cream2)",
                      }}
                    >
                      {m === "pickup" ? "🏬 Pickup" : "🚵 Delivery"}
                    </button>
                  );
                })}
              </div>
              {fulfil.mode === "delivery" && (
                <textarea
                  placeholder="Your delivery address..."
                  value={fulfil.addr}
                  onChange={(e) => setFulfil((f) => ({ ...f, addr: e.target.value }))}
                  style={{ width: "100%", padding: ".55rem .7rem", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--r-sm)", fontFamily: "var(--font-b)", fontSize: ".82rem", color: "var(--cream)", outline: "none", minHeight: 56, resize: "vertical", marginBottom: ".5rem" }}
                />
              )}
              {(fulfil.mode === "pickup" || fulfil.mode === "delivery") && (
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <input type="date" value={fulfil.date} onChange={(e) => setFulfil((f) => ({ ...f, date: e.target.value }))}
                    style={{ flex: 1, padding: ".55rem .7rem", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--r-sm)", fontFamily: "var(--font-b)", fontSize: ".82rem", color: "var(--cream)", outline: "none" }} />
                  <input type="time" value={fulfil.time} onChange={(e) => setFulfil((f) => ({ ...f, time: e.target.value }))}
                    style={{ flex: 1, padding: ".55rem .7rem", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--r-sm)", fontFamily: "var(--font-b)", fontSize: ".82rem", color: "var(--cream)", outline: "none" }} />
                </div>
              )}
            </div>
            <div className="note-row" style={{ margin: ".5rem 0 .2rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-b)", fontSize: ".74rem", fontWeight: 600, color: "var(--cream2)", marginBottom: ".35rem" }}>
                Special instructions <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                placeholder="Name on cake, flavour, allergies, message card..."
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                style={{ width: "100%", minHeight: 60, padding: ".6rem .8rem", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--r-sm)", fontFamily: "var(--font-b)", fontSize: ".82rem", color: "var(--cream)", outline: "none", resize: "vertical" }}
              />
            </div>
            {/* ── Customer details ── */}
            <div style={{ margin: ".6rem 0 .2rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-b)", fontSize: ".74rem", fontWeight: 600, color: "var(--cream2)", marginBottom: ".35rem" }}>
                Your Name <span style={{ color: "var(--rose)" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Full name"
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setOrderErr(""); }}
                style={{ width: "100%", padding: ".55rem .7rem", background: "var(--bg)", border: "1px solid " + (orderErr && !customerName.trim() ? "var(--rose)" : "var(--border2)"), borderRadius: "var(--r-sm)", fontFamily: "var(--font-b)", fontSize: ".82rem", color: "var(--cream)", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ margin: ".4rem 0 .2rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-b)", fontSize: ".74rem", fontWeight: 600, color: "var(--cream2)", marginBottom: ".35rem" }}>
                Phone Number <span style={{ color: "var(--rose)" }}>*</span>
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={customerPhone}
                onChange={(e) => { setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 15)); setOrderErr(""); }}
                style={{ width: "100%", padding: ".55rem .7rem", background: "var(--bg)", border: "1px solid " + (orderErr && !validPhone(customerPhone) ? "var(--rose)" : "var(--border2)"), borderRadius: "var(--r-sm)", fontFamily: "var(--font-b)", fontSize: ".82rem", color: "var(--cream)", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            {orderErr && (
              <p style={{ color: "var(--rose)", fontSize: ".78rem", margin: ".2rem 0 .3rem", fontFamily: "var(--font-b)" }}>{orderErr}</p>
            )}
            <div className="sum-row total"><span>Total</span><span>{inr(total)}</span></div>
            <button className="btn btn-gold" style={{ width: "100%", marginTop: ".8rem" }} onClick={placeOrder}>
              Order on WhatsApp →
            </button>
          </div>
        )}
      </aside>

      {/* QUICK VIEW */}
      {qv.open && qv.product && (
        <div className="modal-overlay show" onTouchMove={(e) => e.preventDefault()} onClick={(e) => { if (e.target === e.currentTarget) setQv((s) => ({ ...s, open: false })); }}>
          <div className="modal qv" style={{ position: "relative" }} onTouchMove={(e) => e.stopPropagation()}>
            <button className="qv-close" onClick={() => setQv((s) => ({ ...s, open: false }))} aria-label="Close">×</button>
            <div className="ph">
              <img src={safeImg(qv.product.image_url)} alt={qv.product.name} decoding="async" onError={onImgError} />
            </div>
            <div className="qv-body">
              <div className="p-rating">{stars(Number(qv.product.rating))} <span style={{ color: "var(--muted)" }}>{Number(qv.product.rating).toFixed(1)}</span></div>
              <h3>{qv.product.name}</h3>
              <div className="p-meta">{qv.product.category_name} · made to order</div>
              <div className="qv-price">{inr(qvUnit)}</div>
              <label style={{ fontSize: ".7rem", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--gold2)" }}>Size</label>
              <div className="opt-row">
                {weightOpts(qv.product.category_name).map((w, i) => (
                  <span key={w.l} className={"opt" + (i === qv.wIdx ? " sel" : "")} role="button" tabIndex={0} onClick={() => setQv((s) => ({ ...s, wIdx: i }))}>{w.l}</span>
                ))}
              </div>
              <label style={{ fontSize: ".7rem", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--gold2)", marginTop: ".8rem", display: "block" }}>Flavour</label>
              <div className="opt-row">
                {FLAVOURS.map((f) => (
                  <span key={f} className={"opt" + (f === qv.flav ? " sel" : "")} role="button" tabIndex={0} onClick={() => setQv((s) => ({ ...s, flav: f }))}>{f}</span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
                <div className="qc">
                  <button onClick={() => setQv((s) => ({ ...s, qty: Math.max(1, s.qty - 1) }))}>−</button>
                  <span>{qv.qty}</span>
                  <button onClick={() => setQv((s) => ({ ...s, qty: s.qty + 1 }))}>+</button>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".8rem", color: "var(--cream2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={qv.egg} onChange={(e) => setQv((s) => ({ ...s, egg: e.target.checked }))} /> Eggless
                </label>
              </div>
              <button className="btn btn-gold" style={{ width: "100%", marginTop: "1.3rem" }} onClick={qvAdd}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMISE YOUR CAKE */}
      {custOpen && (
        <CustomiseModal
          categories={categories}
          initialCat={F.category || "All"}
          onClose={() => setCustOpen(false)}
          notify={notify}
        />
      )}

      {/* TOASTS */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div className="toast info" key={t.id}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   CONTACT SECTION — stores enquiry in Supabase + opens WhatsApp
   ============================================================ */

/* ============================================================
   DELIVERY PROCESS PAGE
   ============================================================ */

/* ============================================================
   GIFT HAMPERS PAGE
   ============================================================ */
function GiftHampersPage({ go, waLink }: { go: (v: any) => void; waLink: (msg: string) => string }) {
  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const [form, setForm] = useState({
    lookingFor: "", occasion: "", quantity: "", budget: "",
    date: "", delivery: "", branding: "",
    includes: [] as string[], notes: "",
  });

  const toggleInclude = (item: string) =>
    setForm(f => ({
      ...f,
      includes: f.includes.includes(item)
        ? f.includes.filter(x => x !== item)
        : [...f.includes, item],
    }));

  const handleSubmit = () => {
    const msg = [
      "🎁 *Gift Hamper Enquiry*",
      `Looking for: ${form.lookingFor || "N/A"}`,
      `Occasion: ${form.occasion || "N/A"}`,
      `Quantity: ${form.quantity || "N/A"}`,
      `Budget per gift: ${form.budget || "N/A"}`,
      `Need by: ${form.date || "N/A"}`,
      `Delivery: ${form.delivery || "N/A"}`,
      `Custom branding: ${form.branding || "N/A"}`,
      `Include: ${form.includes.length ? form.includes.join(", ") : "N/A"}`,
      `Notes: ${form.notes || "N/A"}`,
    ].join("\n");
    window.open(waLink(msg), "_blank");
  };

  const categories = [
    { icon: "🍼", title: "Baby Naming &\nSeeantham Favours",   bg: "#fdf0e6" },
    { icon: "🎂", title: "Birthday\nReturn Gifts",              bg: "#fdeef0" },
    { icon: "🍫", title: "Children's\nSnack Boxes",             bg: "#f0f7ee" },
    { icon: "🪔", title: "Festive Gift\nHampers",               bg: "#fdf6e3" },
    { icon: "💍", title: "Wedding &\nEvent Favours",            bg: "#f3eeff" },
    { icon: "🏢", title: "Corporate\nGifting",                  bg: "#e8f4ff" },
    { icon: "👏", title: "Employee\nAppreciation Gifts",        bg: "#f0fdf4" },
    { icon: "🎀", title: "Custom Branded\nHampers",             bg: "#fff0f6" },
  ];

  const usps = [
    { icon: "🎯", text: "Fully Customisable\nto Your Budget" },
    { icon: "📦", text: "Low Minimum\nQuantities" },
    { icon: "🏷️", text: "Custom Branding\n& Packaging" },
    { icon: "🚗", text: "Chennai-wide\nDelivery" },
    { icon: "🤝", text: "One-point\nCoordination" },
  ];

  const includeItems = [
    "Chocolates", "Savouries", "Cookies", "Dry Fruits",
    "Brownies", "Tea / Coffee", "Cakes", "Children's Treats",
    "Traditional Sweets", "Surprise Me",
  ];

  const galleryColors = ["#f5e6d3","#ede0f5","#d9efd9","#fde8d0","#d8eaf7","#f9dce5"];

  return (
    <div className="gh-wrap">

      {/* HERO */}
      <section className="gh-hero">
        <div className="container">
          <div className="gh-hero-inner">
            <div className="gh-hero-text">
              <span className="section-eyebrow">Thoughtful Gifts, Made With Love</span>
              <h1 className="gh-hero-title">Thoughtful Gifts<br />For Every Occasion</h1>
              <p className="gh-hero-desc">
                From baby naming ceremonies to festive celebrations, corporate events and everything in between —
                we create hampers and return gifts that leave a lasting impression.
              </p>
              <div className="gh-hero-btns">
                <button className="btn btn-gold" onClick={scrollToForm}>Start Your Enquiry →</button>
                <a className="btn btn-ghost" href="#gh-cats">See Our Hampers →</a>
              </div>
            </div>
            <div className="gh-hero-visual">
              <div className="gh-hero-box">🎁</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE CREATE */}
      <section className="gh-section" id="gh-cats">
        <div className="container">
          <h2 className="gh-sec-title">What We Can Create For You</h2>
          <div className="gh-cat-grid">
            {categories.map(c => (
              <div className="gh-cat-tile" key={c.title} style={{ background: c.bg }} onClick={scrollToForm}>
                <div className="gh-cat-img-area">{c.icon}</div>
                <div className="gh-cat-label">{c.title.replace(/\n/g, " ")}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USP STRIP */}
      <div className="gh-usp-strip">
        <div className="container gh-usp-inner">
          {usps.map(u => (
            <div className="gh-usp" key={u.text}>
              <span className="gh-usp-icon">{u.icon}</span>
              <span>{u.text.replace(/\n/g, " ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FORM + GALLERY */}
      <section className="gh-section" ref={formRef}>
        <div className="container">
          <div className="gh-fg-wrap">

            {/* FORM */}
            <div className="gh-form-col">
              <h2 className="gh-sec-title" style={{ textAlign: "left", marginBottom: "1.2rem" }}>Tell Us About Your Requirement</h2>
              <div className="gh-form">
                <div className="gh-form-row">
                  <div className="gh-field">
                    <label>1. What are you looking for? *</label>
                    <select value={form.lookingFor} onChange={e => setForm(f => ({ ...f, lookingFor: e.target.value }))}>
                      <option value="">Select an option</option>
                      <option>Return Gifts</option>
                      <option>Gift Hampers</option>
                      <option>Corporate Gifting</option>
                      <option>Custom Branded Boxes</option>
                      <option>Not Sure Yet</option>
                    </select>
                  </div>
                  <div className="gh-field">
                    <label>2. What&apos;s the occasion? *</label>
                    <input type="text" placeholder="E.g., Baby Naming, Diwali, Birthday Party"
                      value={form.occasion} onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))} />
                  </div>
                </div>
                <div className="gh-form-row">
                  <div className="gh-field">
                    <label>3. How many gifts do you need? *</label>
                    <select value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}>
                      <option value="">Select quantity</option>
                      <option>Less than 25</option>
                      <option>25 – 50</option>
                      <option>50 – 100</option>
                      <option>100 – 250</option>
                      <option>250+</option>
                    </select>
                  </div>
                  <div className="gh-field">
                    <label>4. Approx. budget per gift? *</label>
                    <select value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}>
                      <option value="">Select budget</option>
                      <option>Under ₹200</option>
                      <option>₹200 – ₹500</option>
                      <option>₹500 – ₹1,000</option>
                      <option>₹1,000 – ₹2,000</option>
                      <option>₹2,000+</option>
                    </select>
                  </div>
                </div>
                <div className="gh-form-row">
                  <div className="gh-field">
                    <label>5. When do you need it? *</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="gh-field">
                    <label>6. Delivery Requirement *</label>
                    <select value={form.delivery} onChange={e => setForm(f => ({ ...f, delivery: e.target.value }))}>
                      <option value="">Select an option</option>
                      <option>Pickup from Studio</option>
                      <option>Delivery within Chennai</option>
                      <option>Outstation Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="gh-form-row gh-form-row-wrap">
                  <div className="gh-field">
                    <label>7. Would you like custom branding?</label>
                    <div className="gh-radio-grp">
                      {["Yes","No","Maybe"].map(opt => (
                        <label key={opt} className="gh-radio">
                          <input type="radio" name="gh-branding" value={opt}
                            checked={form.branding === opt}
                            onChange={() => setForm(f => ({ ...f, branding: opt }))} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="gh-field gh-field-wide">
                    <label>8. What would you like to include? <span className="gh-label-hint">(Select all that apply)</span></label>
                    <div className="gh-check-grid">
                      {includeItems.map(item => (
                        <label key={item} className="gh-check">
                          <input type="checkbox" checked={form.includes.includes(item)}
                            onChange={() => toggleInclude(item)} />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="gh-field">
                  <label>9. Tell us more about your requirement</label>
                  <textarea rows={3} placeholder="Share details about your theme, preferences, packaging, message on the box, colours, etc."
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <div className="gh-form-actions">
                  <button className="btn btn-gold" onClick={handleSubmit}>Submit Enquiry →</button>
                  <a className="gh-wa-text" href={waLink("Hi! I’d like to enquire about gift hampers.")} target="_blank" rel="noopener">
                    💬 Prefer to talk? Chat with us on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* GALLERY */}
            <div className="gh-gallery-col">
              <h2 className="gh-sec-title" style={{ textAlign: "left", marginBottom: "1rem" }}>Recent Creations</h2>
              <div className="gh-gallery-grid">
                {galleryColors.map((bg, i) => (
                  <div className="gh-gallery-item" key={i} style={{ background: bg }}>
                    🎁
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost gh-view-more" onClick={scrollToForm}>View More Creations →</button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="gh-footer-cta">
        <div className="container">
          <h2>Let&apos;s Create Something<br />Your Guests Will Remember</h2>
          <p>Share your occasion, quantity and budget and we&apos;ll get back with ideas tailored just for you.</p>
          <div className="gh-footer-btns">
            <button className="btn btn-gold btn-lg" onClick={scrollToForm}>Get in Touch →</button>
            <a className="btn btn-ghost btn-lg" href={waLink("Hi! I want to discuss gift hampers for my event.")} target="_blank" rel="noopener">
              💬 Order on WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}

function DeliveryProcessPage({ go, waLink }: { go: (v: any) => void; waLink: (msg: string) => string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = [
    { q: "Do you deliver across Chennai?", a: "We deliver across most areas in Chennai via trusted cab services. Delivery availability depends on distance and order size. Contact us to confirm for your area." },
    { q: "Can I arrange my own pickup partner?", a: "Yes! You can send a trusted person or arrange your own cab to collect the cake from our studio. Just ensure they handle it with care." },
    { q: "Do you deliver tiered cakes?", a: "For tiered, tall, or highly detailed cakes, we strongly recommend pickup. If delivery is required, it must be via car — never bikes — and extra charges may apply." },
    { q: "What if the recipient is not available?", a: "Please ensure someone is available at the delivery address. We cannot wait indefinitely, and we are not responsible for delays caused by unavailability." },
    { q: "Can I change the delivery time?", a: "Delivery time changes can be accommodated based on availability. Please contact us at least 24 hours in advance to reschedule." },
  ];

  return (
    <div className="dp-wrap">

      {/* HERO */}
      <section className="dp-hero">
        <div className="container">
          <div className="dp-hero-content">
            <span className="section-eyebrow eyebrow-c">Delivery Process</span>
            <h1 className="dp-hero-title">Cake Delivery & Pickup</h1>
            <p className="dp-hero-tag">Every Cake Deserves a Safe Journey</p>
            <p className="dp-hero-desc">Our cakes are handcrafted with so much love and care. We follow a safe delivery process to ensure they reach you in the best possible condition.</p>
          </div>
        </div>
      </section>

      {/* PICKUP VS DELIVERY */}
      <section className="dp-section" style={{ paddingTop: "1.2rem", paddingBottom: "1rem" }}>
        <div className="container">
          <div className="dp-cards">
            <div className="dp-card dp-card-rec">
              <div className="dp-card-icon">🛍️</div>
              <div className="dp-card-badge">Recommended</div>
              <h3>Pickup</h3>
              <p>We highly encourage customers to collect their cakes directly from our Anna Nagar East studio.</p>
              <ul className="dp-checklist">
                <li>Direct handover from our team</li>
                <li>No transit-related risks</li>
                <li>Ideal for tiered, tall &amp; highly detailed cakes</li>
                <li>Greater control over handling &amp; transport</li>
              </ul>
              <a className="btn dp-card-btn" href="https://maps.google.com/?q=D16,8th+Street,Second+Avenue,W+Ext+Rd,Annanagar+East,Chennai+600102" target="_blank" rel="noopener">📍 Studio Location</a>
            </div>
            <div className="dp-card">
              <div className="dp-card-icon">🚗</div>
              <h3>Delivery Through Cab Services</h3>
              <p>If pickup isn&apos;t convenient, we&apos;re happy to arrange delivery through trusted cab partners.</p>
              <ul className="dp-checklist">
                <li>We do not dispatch celebration cakes through bikes</li>
                <li>Cakes are transported via car for greater safety</li>
                <li>Carefully packed to provide maximum stability</li>
              </ul>
              <button className="btn dp-card-btn" onClick={() => go("contact")}>📍 Check Delivery Areas</button>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section className="dp-section" style={{ padding: "1.2rem 0" }}>
        <div className="container">
          <h2 className="dp-sec-title">What To Expect</h2>
          <div className="dp-steps">
            {[
              { icon: "📋", title: "Quality Checked", desc: "Every cake goes through a final quality check" },
              { icon: "📸", title: "Photographed", desc: "We click a picture of your cake before dispatch" },
              { icon: "📦", title: "Securely Packaged", desc: "Carefully packed with multiple layers of protection" },
              { icon: "🚗", title: "Cab Dispatch", desc: "We dispatch via trusted cab partners, not bikes" },
              { icon: "🎉", title: "Celebration Time!", desc: "Your cake is on its way to make your celebration special" },
            ].map((s, i, arr) => (
              <>
                <div className="dp-step" key={s.title}>
                  <div className="dp-step-icon">{s.icon}</div>
                  <div className="dp-step-num">{i + 1}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
                {i < arr.length - 1 && <div className="dp-step-arrow" key={"a" + i}>→</div>}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* IMPORTANT POLICY */}
      <section className="dp-section" style={{ padding: "1.2rem 0" }}>
        <div className="container">
          <div className="dp-policy">
            <div className="dp-policy-text">
              <h3>⚠️ Important Delivery Policy</h3>
              <p>While we take every precaution to package your cake safely, delivery is carried out by third-party transportation services.</p>
              <p>As a result, Strictly Desserts cannot take responsibility for damage that may occur during transit after the cake has been dispatched from our kitchen.</p>
              <div className="dp-policy-note">🛡️ By opting for delivery, customers acknowledge and accept this risk.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CARE GUIDE + FAQs */}
      <section className="dp-section" style={{ padding: "1.2rem 0 1.8rem" }}>
        <div className="container">
          <div className="dp-two-col">
            <div>
              <h3 className="dp-sec-title" style={{ textAlign: "left", marginBottom: "1.2rem" }}>Cake Care Guide</h3>
              <ul className="dp-care-list">
                {["Keep the cake on a flat surface", "Avoid direct sunlight and heat", "Refrigerate if instructed", "Bring to room temperature before serving", "Handle with care while carrying", "Follow any specific instructions shared with you"].map(tip => (
                  <li key={tip}>📌 {tip}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="dp-sec-title" style={{ textAlign: "left", marginBottom: "1.2rem" }}>Delivery FAQs</h3>
              <div className="dp-faq">
                {faqs.map((f, i) => (
                  <div className="dp-faq-item" key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <div className="dp-faq-q">{f.q} <span>{openFaq === i ? "−" : "+"}</span></div>
                    {openFaq === i && <div className="dp-faq-a">{f.a}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.2rem", flexWrap: "wrap" }}>
                <button className="btn btn-ghost" onClick={() => go("contact")}>Still have questions?</button>
                <a className="btn btn-gold" href={waLink("Hi! I have a question about delivery.")} target="_blank" rel="noopener">💬 WhatsApp Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="dp-footer-cta">
        <div className="container">
          <h2>We Want Your Cake To Reach You<br />As Beautiful As It Leaves Us</h2>
          <p>If you have concerns about transportation, venue distance, outdoor events or large celebration cakes, our team will help you choose the safest option.</p>
          <div className="dp-footer-cta-btns">
            <a className="btn btn-gold btn-lg" href={waLink("Hi! I need help choosing the safest delivery option.")} target="_blank" rel="noopener">💬 Get in Touch</a>
            <a className="btn btn-ghost btn-lg" href="tel:+917299047979">📞 Call us at +91 72990 47979</a>
          </div>
        </div>
      </section>

    </div>
  );
}

function ContactSection({ notify }: { notify: (m: string) => void }) {
  return (
    <div className="contact-info-wrap">
      <div className="contact-info-grid">
        <a className="ci-card" href="https://maps.google.com/?q=D16,8th+Street,Second+Avenue,W+Ext+Rd,Annanagar+East,Chennai+600102" target="_blank" rel="noopener">
          <div className="ci-icon">📍</div>
          <h4>Visit Us</h4>
          <p>D16, 8th Street, Second Avenue,<br />W Ext Rd, Annanagar East,<br />Chennai, Tamil Nadu 600102</p>
        </a>
        <a className="ci-card" href="tel:+917299047979">
          <div className="ci-icon">📞</div>
          <h4>Call / WhatsApp</h4>
          <p>+91 72990 47979</p>
          <span className="ci-tag">Tap to call</span>
        </a>
        <a className="ci-card" href="https://www.instagram.com/strictlydesserts" target="_blank" rel="noopener">
          <div className="ci-icon">📸</div>
          <h4>Instagram</h4>
          <p>@strictlydesserts</p>
          <span className="ci-tag">Follow us</span>
        </a>
        <div className="ci-card">
          <div className="ci-icon">🕐</div>
          <h4>Opening Hours</h4>
          <p>Monday – Sunday<br />9 AM – 9 PM</p>
          <span className="ci-tag">Open daily</span>
        </div>
      </div>
      <div className="ci-wa-cta">
        <p>Ready to place an order? Chat with us directly on WhatsApp — we respond fast! 🎂</p>
        <a className="btn btn-gold btn-lg" href={waLink("Hi Strictly Desserts! I'd like to place an order.")} target="_blank" rel="noopener">
          💬 Order on WhatsApp
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOMISE MODAL — stores enquiry in Supabase + opens WhatsApp
   ============================================================ */
function CustomiseModal({
  categories,
  initialCat,
  onClose,
  notify,
}: {
  categories: Category[];
  initialCat: string;
  onClose: () => void;
  notify: (m: string) => void;
}) {
  const catNames = useMemo(() => ["All", ...categories.map((c) => c.name)], [categories]);
  const [cat, setCat] = useState(catNames.includes(initialCat) ? initialCat : "All");
  const [weight, setWeight] = useState("");
  const [serv, setServ] = useState("");
  const [flav, setFlav] = useState(FLAVOURS[0]);
  const [theme, setTheme] = useState("");
  const [tier, setTier] = useState("Single tier");
  const [design, setDesign] = useState("");
  const [cakeMsg, setCakeMsg] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [transit, setTransit] = useState("Delivery");
  const [name, setName] = useState("");
  const [addr, setAddr] = useState("");
  const [ph1, setPh1] = useState("");
  const [ph2, setPh2] = useState("");
  const [refName, setRefName] = useState("");
  const [prev, setPrev] = useState("");
  const [err, setErr] = useState("");

  const today = useMemo(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
    []
  );

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    const clear = (m: string) => { setRefName(""); setPrev(""); e.target.value = ""; if (m) setErr(m); };
    if (!f) return clear("");
    const FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (FILE_TYPES.indexOf(f.type) === -1 || !/\.(jpe?g|png|webp)$/i.test(f.name)) return clear("Please upload a JPG, PNG or WEBP image.");
    if (f.size > 5 * 1024 * 1024) return clear("Image is too large — maximum size is 5 MB.");
    setErr("");
    setRefName(f.name);
    const rd = new FileReader();
    rd.onload = (ev) => {
      const src = String(ev.target?.result || "");
      if (!/^data:image\/(png|jpe?g|webp);/i.test(src)) return clear("That file is not a valid image.");
      setPrev(src);
    };
    rd.onerror = () => clear("Could not read that file.");
    rd.readAsDataURL(f);
  };

  const send = useCallback(async () => {
    const nm = cleanText(name, 60);
    if (!nm || !ph1) { setErr("Please add at least your name and primary contact number."); return; }
    if (!validPhone(ph1)) { setErr("Please enter a valid primary contact number (10–15 digits)."); return; }
    if (ph2 && !validPhone(ph2)) { setErr("Secondary number doesn't look valid."); return; }
    setErr("");

    const fmtDate = (d: string) => {
      if (!d) return "";
      const p = d.split("-");
      return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    };
    const fmtTime = (t: string) => {
      if (!t) return "";
      const p = t.split(":");
      let h = parseInt(p[0], 10);
      const ap = h >= 12 ? "PM" : "AM";
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      return h12 + ":" + p[1] + " " + ap;
    };
    const dt = [fmtDate(date), fmtTime(time)].filter(Boolean).join(", ");

    const L: string[] = [];
    L.push("Hi Strictly Desserts! 🎂 I'd like to customise a cake.");
    L.push("");
    L.push("CATEGORY: " + cat);
    L.push("");
    L.push("CUSTOMISATION REQUEST");
    L.push("Weight: " + (cleanText(weight, 300) || "-"));
    L.push("Servings: " + (cleanText(serv, 300) || "-"));
    L.push("Cake flavor: " + flav);
    L.push("Theme / Reference image: " + (cleanText(theme, 300) || "-"));
    L.push("Single tier / Mini tier: " + tier);
    if (design) { L.push(""); L.push("Specific design to recreate: " + cleanText(design, 300)); }
    L.push("");
    L.push("ORDER ITEMS");
    L.push("Cake flavor: " + flav);
    L.push("Design: " + (cleanText(design, 300) || cleanText(theme, 300) || "-"));
    L.push("Msg on cake: " + (cleanText(cakeMsg, 300) || "-"));
    L.push("");
    L.push("DATE & TIME: " + (dt || "-"));
    L.push("NAME: " + nm);
    L.push("ADDRESS: " + (cleanText(addr, 300) || "-"));
    L.push("CONTACT (primary): " + ph1);
    L.push("CONTACT (secondary): " + (ph2 || "-"));
    L.push("ORDER TRANSIT: " + transit);
    // Upload reference image to Supabase Storage and get a shareable URL
    let imageUrl = "";
    if (prev && refName) {
      try {
        const upRes = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUri: prev, fileName: refName }),
        });
        const upData = await upRes.json();
        if (upData.url) imageUrl = upData.url;
      } catch { /* non-blocking */ }
    }

    if (refName) {
      L.push("");
      L.push("📎 Reference image: " + (imageUrl || refName));
    }

    try {
      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nm,
          contact: ph1,
          message: L.join("\n"),
          category: cat,
          source: "customise",
          payload: { weight, serv, flav, theme, tier, design, cakeMsg, date, time, transit, addr, ph1, ph2, refName, imageUrl },
        }),
      });
    } catch {
      /* non-blocking */
    }

    window.open(waLink(L.join("\n")), "_blank", "noopener");
    onClose();
    notify("Opening WhatsApp to send your customisation 🎂");
  }, [name, ph1, ph2, cat, weight, serv, flav, theme, tier, design, cakeMsg, date, time, transit, addr, refName, prev, onClose, notify]);

  return (
    <div className="modal-overlay show" onTouchMove={(e) => e.preventDefault()} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal cust-modal">
        <button className="qv-close" onClick={onClose}>×</button>
        <h3>Customise Your Cake <em>{cat && cat !== "All" ? "(" + cat + ")" : ""}</em></h3>
        <p className="cust-sub">Tell us exactly what you&apos;d like and we&apos;ll craft it for you. Everything below is sent to us in one WhatsApp message. 🎂</p>

        <label>Category</label>
        <select className="field" value={cat} onChange={(e) => setCat(e.target.value)}>
          {catNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        <div className="cust-grid">
          <div><label>Weight</label><input className="field" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 1 kg" /></div>
          <div><label>Servings</label><input className="field" value={serv} onChange={(e) => setServ(e.target.value)} placeholder="e.g. 8–10 people" /></div>
        </div>

        <label>Cake flavour <span style={{ textTransform: "none", fontWeight: 400, color: "var(--muted)" }}>(choose from catalogue)</span></label>
        <select className="field" value={flav} onChange={(e) => setFlav(e.target.value)}>
          {FLAVOURS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <label>Theme / Reference</label>
        <input className="field" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. Pastel floral, jungle theme, gold drip…" />

        <label>Reference image</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="cust-file" onChange={onFile} />
        {prev && <img className="preview-img" src={prev} style={{ display: "block", width: "100%", objectFit: "cover", marginTop: ".6rem" }} alt="reference preview" />}
        <p className="cust-hint">Pick your reference image — it will be uploaded automatically and the link included in your WhatsApp message. 📎</p>

        <label>Tier</label>
        <div className="cust-pills">
          {["Single tier", "Mini tier"].map((t) => (
            <span key={t} className={"cpill" + (tier === t ? " sel" : "")} role="button" tabIndex={0} onClick={() => setTier(t)}>{t}</span>
          ))}
        </div>

        <label>Specific design to recreate <span style={{ textTransform: "none", fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
        <textarea className="field" style={{ minHeight: 70 }} value={design} onChange={(e) => setDesign(e.target.value)} placeholder="If you have any specific design to be recreated, please share the details here…" />

        <div className="cust-divider">Order items</div>
        <label>Message on cake</label>
        <input className="field" value={cakeMsg} onChange={(e) => setCakeMsg(e.target.value)} placeholder="e.g. Happy Birthday Riya!" />

        <div className="cust-divider">Date &amp; time</div>
        <div className="cust-grid">
          <div><label>Date</label><input type="date" className="field" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label>Time</label><input type="time" className="field" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        </div>

        <label>Order transit</label>
        <div className="cust-pills">
          {[["Delivery", "🚵 Delivery"], ["Pickup", "🏢 Pickup"]].map(([v, l]) => (
            <span key={v} className={"cpill" + (transit === v ? " sel" : "")} role="button" tabIndex={0} onClick={() => setTransit(v)}>{l}</span>
          ))}
        </div>

        <div className="cust-divider">Your details</div>
        <label>Name</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <label>Address</label><textarea className="field" style={{ minHeight: 70 }} value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Full delivery address (for delivery orders)" />
        <div className="cust-grid">
          <div><label>Contact — primary</label><input className="field" value={ph1} onChange={(e) => setPh1(e.target.value)} placeholder="Primary number" /></div>
          <div><label>Contact — secondary</label><input className="field" value={ph2} onChange={(e) => setPh2(e.target.value)} placeholder="Secondary number" /></div>
        </div>

        <div className="cust-note">
          <b>Please note</b>
          Delivery charges are paid directly to the cab driver on receiving the cake, as per the app&apos;s actual charges. Pickup can be done from our Anna Nagar East outlet.<br /><br />
          Payment details will be shared once we receive the details above. 😊
        </div>

        <div className="err">{err}</div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={send}>Send on WhatsApp →</button>
        </div>
      </div>
    </div>
  );
}
