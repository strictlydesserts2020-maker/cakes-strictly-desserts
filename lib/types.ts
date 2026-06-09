// Shared domain types (match the Supabase schema).

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  occasions: string[];
  is_eggless: boolean;
  badge: string | null;
  rating: number;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  // joined / derived on the storefront
  category_name?: string;
}

export interface Enquiry {
  id: string;
  name: string;
  contact: string | null;
  message: string;
  category: string | null;
  source: "contact" | "customise";
  payload: Record<string, unknown>;
  is_handled: boolean;
  created_at: string;
}

// Cart item used client-side only.
export interface CartItem {
  pid: string;
  name: string;
  img: string;
  weight: string;
  flavour: string;
  egg: boolean;
  unit: number;
  qty: number;
}
