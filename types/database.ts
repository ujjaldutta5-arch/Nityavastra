export type StaffRole = 'admin' | 'order_manager' | 'inventory_manager' | 'customer';

export interface Profile {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: StaffRole;
  banned?: boolean | null;
  address?: Record<string, unknown>;
}

export interface Product {
  id: string;
  slug?: string | null;
  name: string;
  category: string;
  sub_category?: string | null;
  price: number;
  old_price?: number | null;
  image: string;
  description?: string | null;
  stock?: number | null;
  rating?: number | null;
  review_count?: number | null;
  tags?: string[] | null;
  product_tags?: string[] | null;
  hsn?: string | null;
  gst_rate?: number | null;
  fabric?: string | null;
  media?: unknown;
  featured?: boolean | null;
  [key: string]: unknown;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  variant_sku?: string | null;
  products?: Product | null;
  product?: Product | null;
  unit_price?: number;
}

export interface Order {
  id: string;
  user_id?: string | null;
  status: string;
  payment_status: string;
  total: number;
  [key: string]: unknown;
}

export interface Banner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  display_order?: number | null;
  active?: boolean | null;
  [key: string]: unknown;
}

export interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order?: number | null;
  max_discount?: number | null;
  usage_limit?: number | null;
  expires_at?: string | null;
  active?: boolean | null;
  [key: string]: unknown;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  type: string;
  status: string;
  reason?: string | null;
  [key: string]: unknown;
}

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  featured?: boolean | null;
  admin_reply?: string | null;
  profiles?: { name?: string | null } | null;
  [key: string]: unknown;
}

export interface MediaItem {
  kind: "image" | "video" | string;
  url: string;
}
