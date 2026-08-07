-- ============================================================================
-- NITYAVASTRA — FULL SUPABASE SCHEMA (fresh project)
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- Order: tables → helpers → policies (do not reorder)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: TABLES (no staff helper policies yet)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_slug text,
  image text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  slug text UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  sub_category text,
  price numeric(10,2) NOT NULL,
  old_price numeric(10,2),
  image text NOT NULL,
  description text,
  stock int DEFAULT 0,
  rating numeric(3,1) DEFAULT 4.5,
  review_count int DEFAULT 0,
  tags text[] DEFAULT '{}',
  product_tags text[] DEFAULT '{}',
  hsn text DEFAULT '6304',
  gst_rate numeric(5,2) DEFAULT 5.0,
  fabric text,
  color_options jsonb DEFAULT '[]',
  size_options jsonb DEFAULT '[]',
  dimensions jsonb DEFAULT '{}',
  media jsonb DEFAULT '[]',
  vendor text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image text NOT NULL,
  cta_text text,
  cta_link text,
  display_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  html_content text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes(phone);

-- Profiles MUST exist before is_staff() / is_admin()
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'customer',
  banned boolean DEFAULT false,
  address jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  variant_sku text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  razorpay_order_id text,
  razorpay_payment_id text,
  coupon_code text,
  discount numeric(10,2) DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping_fee numeric(10,2) DEFAULT 0,
  tax_cgst numeric(10,2) DEFAULT 0,
  tax_sgst numeric(10,2) DEFAULT 0,
  tax_igst numeric(10,2) DEFAULT 0,
  taxable_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  shipping_address jsonb NOT NULL DEFAULT '{}',
  customer_name text,
  customer_email text,
  customer_phone text,
  notes text,
  tracking_number text,
  courier_name text,
  tracking_url text,
  shiprocket_awb text,
  shiprocket_order_id text,
  shiprocket_last_status text,
  tracking_steps jsonb DEFAULT '[]',
  shipped_at timestamptz,
  delivered_at timestamptz,
  refund_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  variant_sku text,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  gst_rate numeric(5,2) DEFAULT 5.0,
  hsn text,
  line_total numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'percent',
  value numeric(10,2) NOT NULL,
  min_order numeric(10,2) DEFAULT 0,
  max_discount numeric(10,2),
  active boolean DEFAULT true,
  usage_limit int,
  used_count int DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_settings (
  id text PRIMARY KEY DEFAULT 'default',
  free_shipping_threshold numeric(10,2) DEFAULT 999,
  base_shipping_fee numeric(10,2) DEFAULT 79,
  cod_enabled boolean DEFAULT true,
  cod_pincodes text[] DEFAULT '{}',
  razorpay_mode text DEFAULT 'test',
  razorpay_live_key text,
  razorpay_live_secret text,
  whatsapp_number text DEFAULT '918777787700',
  seller_name text DEFAULT 'Nityavastra',
  seller_gstin text,
  seller_address text DEFAULT 'Bhubaneswar, Odisha 751019',
  seller_phone text DEFAULT '+91-87777-87700',
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.store_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'return',
  reason text,
  details text,
  status text NOT NULL DEFAULT 'pending',
  restock boolean DEFAULT false,
  refund_amount numeric(10,2),
  refund_id text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_returns_order ON public.returns(order_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  comment text,
  photos text[] DEFAULT '{}',
  visible boolean DEFAULT true,
  featured boolean DEFAULT false,
  admin_reply text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  name text,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  channel text NOT NULL DEFAULT 'email',
  event text,
  recipient text,
  subject text,
  body text,
  status text DEFAULT 'pending',
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  phone text,
  items jsonb DEFAULT '[]',
  total numeric(10,2) DEFAULT 0,
  recovered boolean DEFAULT false,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  delta int NOT NULL,
  reason text,
  actor_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shiprocket_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb,
  awb text,
  status text,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sr_webhooks_created ON public.shiprocket_webhooks(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: HELPER FUNCTIONS + AUTH TRIGGER (after profiles exists)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'order_manager', 'inventory_manager')
      AND COALESCE(banned, false) = false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND COALESCE(banned, false) = false
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shiprocket_webhooks ENABLE ROW LEVEL SECURITY;

-- Categories
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "staff_write_categories" ON public.categories;
CREATE POLICY "staff_write_categories" ON public.categories
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Products
DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "staff_write_products" ON public.products;
CREATE POLICY "staff_write_products" ON public.products
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Banners
DROP POLICY IF EXISTS "public_read_banners" ON public.banners;
CREATE POLICY "public_read_banners" ON public.banners
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "staff_write_banners" ON public.banners;
CREATE POLICY "staff_write_banners" ON public.banners
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- CMS
DROP POLICY IF EXISTS "public_read_pages" ON public.cms_pages;
CREATE POLICY "public_read_pages" ON public.cms_pages
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "staff_write_pages" ON public.cms_pages;
CREATE POLICY "staff_write_pages" ON public.cms_pages
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff());
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_staff_update" ON public.profiles;
CREATE POLICY "profiles_staff_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Cart / wishlist
DROP POLICY IF EXISTS "owner_cart_all" ON public.cart_items;
CREATE POLICY "owner_cart_all" ON public.cart_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_wishlist" ON public.wishlists;
CREATE POLICY "owner_wishlist" ON public.wishlists
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders
DROP POLICY IF EXISTS "orders_select_own_or_staff" ON public.orders;
CREATE POLICY "orders_select_own_or_staff" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff());
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff())
    )
  );
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- Coupons / settings
DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;
CREATE POLICY "coupons_public_read" ON public.coupons
  FOR SELECT TO anon, authenticated USING (active = true);
DROP POLICY IF EXISTS "coupons_staff_all" ON public.coupons;
CREATE POLICY "coupons_staff_all" ON public.coupons
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "settings_public_read" ON public.store_settings;
CREATE POLICY "settings_public_read" ON public.store_settings
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "settings_admin_write" ON public.store_settings;
CREATE POLICY "settings_admin_write" ON public.store_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Returns
DROP POLICY IF EXISTS "returns_owner_select" ON public.returns;
CREATE POLICY "returns_owner_select" ON public.returns
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff());
DROP POLICY IF EXISTS "returns_owner_insert" ON public.returns;
CREATE POLICY "returns_owner_insert" ON public.returns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "returns_staff_update" ON public.returns;
CREATE POLICY "returns_staff_update" ON public.returns
  FOR UPDATE TO authenticated USING (public.is_staff());

-- Reviews
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (
    visible = true AND NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = reviews.user_id AND p.banned = true
    )
  );
DROP POLICY IF EXISTS "reviews_owner_insert" ON public.reviews;
CREATE POLICY "reviews_owner_insert" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reviews_staff_all" ON public.reviews;
CREATE POLICY "reviews_staff_all" ON public.reviews
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- CRM
DROP POLICY IF EXISTS "tickets_owner_select" ON public.tickets;
CREATE POLICY "tickets_owner_select" ON public.tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff());
DROP POLICY IF EXISTS "tickets_insert_auth" ON public.tickets;
CREATE POLICY "tickets_insert_auth" ON public.tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "tickets_insert_anon" ON public.tickets;
CREATE POLICY "tickets_insert_anon" ON public.tickets
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "tickets_staff_update" ON public.tickets;
CREATE POLICY "tickets_staff_update" ON public.tickets
  FOR UPDATE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "notifications_staff" ON public.notifications;
CREATE POLICY "notifications_staff" ON public.notifications
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "abandoned_staff" ON public.abandoned_carts;
CREATE POLICY "abandoned_staff" ON public.abandoned_carts
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "stock_audits_staff" ON public.stock_audits;
CREATE POLICY "stock_audits_staff" ON public.stock_audits
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "sr_webhooks_staff" ON public.shiprocket_webhooks;
CREATE POLICY "sr_webhooks_staff" ON public.shiprocket_webhooks
  FOR SELECT TO authenticated USING (public.is_staff());

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: STORAGE
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('reviews', 'reviews', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_media" ON storage.objects;
CREATE POLICY "public_read_media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('products', 'banners', 'reviews'));

DROP POLICY IF EXISTS "staff_upload_media" ON storage.objects;
CREATE POLICY "staff_upload_media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id IN ('products', 'banners', 'reviews') AND public.is_staff())
  WITH CHECK (bucket_id IN ('products', 'banners', 'reviews') AND public.is_staff());

DROP POLICY IF EXISTS "auth_upload_review_photos" ON storage.objects;
CREATE POLICY "auth_upload_review_photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reviews');

NOTIFY pgrst, 'reload schema';
