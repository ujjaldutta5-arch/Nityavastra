ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS size_type text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS has_variants boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS low_stock_threshold int DEFAULT 5,
  ADD COLUMN IF NOT EXISTS saree_length_m numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blouse_piece_included boolean DEFAULT false;

-- One abandoned-cart row per user for upsert
CREATE UNIQUE INDEX IF NOT EXISTS abandoned_carts_user_id_uidx
  ON public.abandoned_carts (user_id)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.products.variants IS 'Array of {sku,size,color,color_hex,stock}';
COMMENT ON COLUMN public.products.size_type IS 'none|garment|trouser|saree|kids|custom';
