export type StaffRole = "admin" | "order_manager" | "inventory_manager" | "customer";

export type SizeType = "none" | "garment" | "trouser" | "saree" | "kids" | "custom";

export interface Profile {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: StaffRole;
  banned?: boolean | null;
  address?: Record<string, unknown>;
}

export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  color_hex?: string;
  stock: number;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ProductDimensions {
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  weight_g?: number;
}

export interface MediaItem {
  kind: "image" | "video" | string;
  url: string;
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
  color_options?: ColorOption[] | null;
  size_options?: string[] | null;
  dimensions?: ProductDimensions | null;
  media?: MediaItem[] | null;
  variants?: ProductVariant[] | null;
  size_type?: SizeType | string | null;
  has_variants?: boolean | null;
  low_stock_threshold?: number | null;
  saree_length_m?: number | null;
  blouse_piece_included?: boolean | null;
  vendor?: string | null;
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
  photos?: string[] | null;
  featured?: boolean | null;
  admin_reply?: string | null;
  profiles?: { name?: string | null } | null;
  [key: string]: unknown;
}
