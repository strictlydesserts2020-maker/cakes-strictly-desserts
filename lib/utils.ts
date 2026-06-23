// ------------------------------------------------------------
//  Shared helpers — ported 1:1 from the original site so that
//  formatting, validation and security behaviour stay identical.
// ------------------------------------------------------------

/** Indian Rupee formatting, e.g. ₹1,299 */
export function inr(n: number): string {
  return "\u20B9" + Math.round(n).toLocaleString("en-IN");
}

/** Allow only safe image URLs (https / protocol-relative / data:image / root-relative). */
export function safeImg(u: string | null | undefined): string {
  u = String(u == null ? "" : u).trim();
  if (
    /^https:\/\//i.test(u) ||
    /^\/\//.test(u) ||
    /^data:image\/(png|jpe?g|webp|gif);/i.test(u) ||
    /^\//.test(u)
  ) {
    if (u.includes('/storage/v1/object/public/')) {
      u = u.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      if (!u.includes('?')) u += '?width=900&height=900&quality=92&format=webp&resize=cover';
    }
    return u;
  }
  return "";
}

/** Strip control chars, trim and optionally cap length. */
export function cleanText(s: string | null | undefined, max?: number): string {
  s = String(s == null ? "" : s).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return max ? s.slice(0, max) : s;
}

export function validPhone(s: string): boolean {
  const d = String(s || "").replace(/[^\d]/g, "");
  return d.length >= 10 && d.length <= 15;
}

export function validEmailOrPhone(s: string): boolean {
  s = String(s || "").trim();
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || validPhone(s);
}

/** Star string (★/☆) for a rating. */
export function stars(r: number): string {
  const full = Math.round(r);
  let s = "";
  for (let i = 0; i < 5; i++) s += i < full ? "\u2605" : "\u2606";
  return s;
}

/** Weight/serving options depend on category. */
export function weightOpts(categoryName?: string) {
  if (categoryName === "Cupcakes") {
    return [
      { l: "Box of 6", m: 1 },
      { l: "Box of 12", m: 1.9 },
    ];
  }
  if (categoryName === "Mini tiers") {
    return [
      { l: "1 kg", m: 1 },
      { l: "1.5 kg", m: 1 },
      { l: "2 kg", m: 1 },
    ];
  }
  return [
    { l: "0.5 kg", m: 1 },
    { l: "1 kg", m: 1.85 },
    { l: "2 kg", m: 3.5 },
  ];
}

export function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const FLAVOURS = [
  "Chocolate",
  "Vanilla",
  "Red Velvet",
  "Butterscotch",
  "Strawberry",
];

export const BENTO_FLAVOURS = [
  "Chocolate Truffle Cake",
  "Biscoff Chocolate",
  "Biscoff Vanilla",
  "Chunky Nutella",
  "White Chocolate & Blueberry",
  "Strawberry Cheesecake",
  "Vanilla & Butterscotch",
];

export const MINI_TIERS_FLAVOURS = [
  "Butterscotch",
  "Chocolate Truffle",
  "Chunky Nutella",
  "White Chocolate & Blueberry",
  "Strawberry Cheesecake",
  "Biscoff Chocolate",
];

/** Flavours shown in the Customise Your Cake modal when Mini tiers is selected */
export const MINI_TIERS_CUST_FLAVOURS = [
  "Rasmalai",
  "Vanilla & Mixed Berry",
  "Mocha Hazelnut",
  "Brownie Batter",
  "Dried Fruits & Toffee Sauce",
  "Snickers",
  "Banana & Nutella",
  "Butterscotch",
  "Chocolate Truffle",
  "Chunky Nutella",
  "White Chocolate & Blueberry",
  "Strawberry Cheesecake",
  "Biscoff Chocolate",
  "Black Forest",
  "Red Velvet Cheesecake",
];
export const MINI_TIERS_ADDON: Record<string, [number, number]> = {
  "Butterscotch": [800, 1650],
  "Chocolate Truffle": [1100, 2000],
  "Chunky Nutella": [850, 1650],
  "White Chocolate & Blueberry": [1150, 2250],
  "Strawberry Cheesecake": [950, 1650],
  "Biscoff Chocolate": [1150, 2250],
};

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919003082979";

export function waLink(text: string): string {
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
}
