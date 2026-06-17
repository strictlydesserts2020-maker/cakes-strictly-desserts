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
  flavor: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  // joined / derived on the storefront
  category_name?: string;
}

export interface Enquiry {
  id: string;
  order_number?: number;
  name: string;
  contact: string | null;
  message: string;
  category: string | null;
  source: "contact" | "customise";
  payload: Record<string, unknown>;
  is_handled: boolean;
  created_at: string;
  order_status: "pending" | "accepted" | "rejected";
  final_payment: number | null;
  delivery_date: string | null;
}

// Cart item used client-side only.
export interface CartItem {
  pid: string;
  name: string;
  img: string;
  weight: string;
  flavour: string;
  unit: number;
  qty: number;
}
