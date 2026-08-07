-- Demo product with size×color variants + multi-media (catalog parity)

INSERT INTO public.products (
  id, slug, name, category, sub_category, price, old_price, image, description, stock,
  tags, product_tags, featured, fabric, hsn, gst_rate, rating, review_count,
  color_options, size_options, dimensions, media, variants, size_type, has_variants,
  low_stock_threshold, saree_length_m, blouse_piece_included
) VALUES (
  'v1',
  'handloom-cotton-kurti-set',
  'Handloom Cotton Kurti Set',
  'daily-wear',
  'kurtis',
  1499,
  1999,
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=940',
  'Soft handloom cotton kurti with coordinated pants. Choose your size and colour — each combination stocks separately.',
  48,
  ARRAY['cotton','kurti','daily'],
  ARRAY['new-arrival','casual'],
  true,
  'Cotton',
  '6204',
  5.0,
  4.7,
  0,
  '[{"name":"Crimson","hex":"#7C1F30"},{"name":"Navy","hex":"#1E3A5F"}]'::jsonb,
  '["S","M","L"]'::jsonb,
  '{"length_cm":30,"width_cm":25,"height_cm":4,"weight_g":450}'::jsonb,
  '[
    {"kind":"image","url":"https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=940"},
    {"kind":"image","url":"https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=940"},
    {"kind":"image","url":"https://images.unsplash.com/photo-1619516388835-2b60acc4049e?q=80&w=940"}
  ]'::jsonb,
  '[
    {"sku":"V1-S-CRIMSON","size":"S","color":"Crimson","color_hex":"#7C1F30","stock":8},
    {"sku":"V1-M-CRIMSON","size":"M","color":"Crimson","color_hex":"#7C1F30","stock":12},
    {"sku":"V1-L-CRIMSON","size":"L","color":"Crimson","color_hex":"#7C1F30","stock":5},
    {"sku":"V1-S-NAVY","size":"S","color":"Navy","color_hex":"#1E3A5F","stock":10},
    {"sku":"V1-M-NAVY","size":"M","color":"Navy","color_hex":"#1E3A5F","stock":10},
    {"sku":"V1-L-NAVY","size":"L","color":"Navy","color_hex":"#1E3A5F","stock":3}
  ]'::jsonb,
  'garment',
  true,
  5,
  0,
  false
)
ON CONFLICT (id) DO UPDATE SET
  variants = EXCLUDED.variants,
  media = EXCLUDED.media,
  color_options = EXCLUDED.color_options,
  size_options = EXCLUDED.size_options,
  dimensions = EXCLUDED.dimensions,
  has_variants = true,
  size_type = 'garment',
  stock = EXCLUDED.stock,
  product_tags = EXCLUDED.product_tags;
