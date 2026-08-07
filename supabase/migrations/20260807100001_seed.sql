-- ============================================================================
-- NITYAVASTRA — SEED DATA (run AFTER schema.sql)
-- Paste into Supabase SQL Editor → Run
-- ============================================================================

-- Categories
INSERT INTO public.categories (slug, name, parent_slug, display_order, image) VALUES
  ('sarees', 'Sarees', NULL, 1, 'https://images.unsplash.com/photo-1646979200020-941e1deb2670?q=80&w=940'),
  ('daily-wear', 'Daily Wear', NULL, 2, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=940'),
  ('home-essentials', 'Home Essentials', NULL, 3, 'https://images.pexels.com/photos/7546636/pexels-photo-7546636.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'),
  ('silk', 'Silk', 'sarees', 1, NULL),
  ('cotton', 'Cotton', 'sarees', 2, NULL),
  ('banarasi', 'Banarasi', 'sarees', 3, NULL),
  ('chiffon', 'Chiffon Sarees', 'sarees', 4, NULL),
  ('handloom', 'Handloom Sarees', 'sarees', 5, NULL),
  ('kurtis', 'Kurtis', 'daily-wear', 1, NULL),
  ('bedsheets', 'Bedsheets', 'home-essentials', 1, NULL),
  ('kitchen-linen', 'Kitchen Linen', 'home-essentials', 2, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Products
INSERT INTO public.products (id, slug, name, category, sub_category, price, old_price, image, description, stock, tags, product_tags, featured, fabric, hsn, gst_rate, rating, review_count) VALUES
('s1', 'kanjivaram-silk-saree-crimson', 'Kanjivaram Silk Saree - Crimson', 'sarees', 'silk', 4999, 6499,
  'https://images.unsplash.com/photo-1646979200020-941e1deb2670?crop=entropy&cs=srgb&fm=jpg&q=85',
  'Handwoven pure silk Kanjivaram saree with zari border. A timeless piece for weddings and festivals.',
  12, ARRAY['silk','wedding','handloom'], ARRAY['bestseller'], true, 'Silk', '6304', 5.0, 4.5, 0),
('s2', 'banarasi-woven-saree-ivory', 'Banarasi Woven Saree - Ivory', 'sarees', 'banarasi', 3799, 4999,
  'https://images.unsplash.com/photo-1619516388835-2b60acc4049e?crop=entropy&cs=srgb&fm=jpg&q=85',
  'Elegant Banarasi silk saree with intricate meenakari work. Perfect for special occasions.',
  8, ARRAY['banarasi','silk'], ARRAY['bestseller'], true, 'Silk', '6304', 5.0, 4.5, 0),
('s3', 'chanderi-cotton-saree-sage', 'Chanderi Cotton Saree - Sage', 'sarees', 'cotton', 1899, 2499,
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?crop=entropy&cs=srgb&fm=jpg&q=85&w=940',
  'Lightweight Chanderi cotton with subtle motifs. Comfortable and elegant for daily wear.',
  25, ARRAY['cotton','chanderi','daily'], ARRAY['new-arrival'], false, 'Cotton', '6304', 5.0, 4.5, 0),
('s4', 'mysore-silk-saree-ochre', 'Mysore Silk Saree - Ochre', 'sarees', 'silk', 2799, 3499,
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?crop=entropy&cs=srgb&fm=jpg&q=85&w=940',
  'Pure Mysore silk with contrast border. Soft, flowing and elegant.',
  15, ARRAY['silk','mysore'], ARRAY['festive'], true, 'Silk', '6304', 5.0, 4.5, 0),
('s5', 'chiffon-saree-blush-pink', 'Chiffon Saree - Blush Pink', 'sarees', 'chiffon', 1799, 2499,
  'https://images.pexels.com/photos/6480707/pexels-photo-6480707.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'Lightweight chiffon saree with elegant floral embroidery. Perfect for office and casual outings.',
  15, ARRAY['bestseller','new-arrival'], ARRAY['bestseller','new-arrival'], true, 'Chiffon', '6304', 5.0, 4.5, 0),
('s6', 'chiffon-saree-teal-blue', 'Chiffon Saree - Teal Blue', 'sarees', 'chiffon', 1999, 2799,
  'https://images.unsplash.com/photo-1646979200020-941e1deb2670?crop=entropy&cs=srgb&fm=jpg&q=85',
  'Flowing teal blue chiffon saree with delicate zari border.',
  12, ARRAY['festive','new-arrival'], ARRAY['festive','new-arrival'], false, 'Chiffon', '6304', 5.0, 4.5, 0),
('s7', 'handloom-saree-natural-beige', 'Handloom Saree - Natural Beige', 'sarees', 'handloom', 2299, 2999,
  'https://images.pexels.com/photos/6480707/pexels-photo-6480707.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'Handwoven handloom saree in natural beige with traditional ikat patterns.',
  8, ARRAY['festive','new-arrival'], ARRAY['festive','new-arrival'], true, 'Handloom', '6304', 5.0, 4.5, 0),
('k1', 'cotton-kurti-indigo', 'Cotton Kurti - Indigo', 'daily-wear', 'kurtis', 899, 1199,
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=940',
  'Breathable cotton kurti in deep indigo. Ideal for everyday elegance.',
  40, ARRAY['cotton','kurti'], ARRAY['bestseller','new-arrival'], true, 'Cotton', '6204', 5.0, 4.5, 0),
('k2', 'linen-kurti-ivory', 'Linen Kurti - Ivory', 'daily-wear', 'kurtis', 1299, 1599,
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=940',
  'Relaxed linen kurti with subtle embroidery. Soft and breathable.',
  28, ARRAY['linen','kurti'], ARRAY['new-arrival'], false, 'Linen', '6204', 5.0, 4.5, 0),
('b1', 'jaipuri-block-print-bedsheet-king', 'Jaipuri Block Print Bedsheet - King', 'home-essentials', 'bedsheets', 1499, 1999,
  'https://images.pexels.com/photos/7546636/pexels-photo-7546636.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'Pure cotton bedsheet with traditional Jaipuri block print. Includes 2 pillow covers.',
  30, ARRAY['cotton','king','block-print'], ARRAY['bestseller'], true, 'Cotton', '6304', 5.0, 4.5, 0),
('b2', 'percale-cotton-bedsheet-ivory', 'Percale Cotton Bedsheet - Ivory', 'home-essentials', 'bedsheets', 1299, 1699,
  'https://images.pexels.com/photos/19836807/pexels-photo-19836807.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  '300 thread count percale cotton bedsheet. Crisp, cool and durable.',
  40, ARRAY['cotton','percale'], ARRAY['new-arrival'], false, 'Cotton', '6304', 5.0, 4.5, 0),
('b3', 'handloom-cotton-bedsheet-terracotta', 'Handloom Cotton Bedsheet - Terracotta', 'home-essentials', 'bedsheets', 1799, 2199,
  'https://images.pexels.com/photos/6480707/pexels-photo-6480707.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'Handloom-woven cotton bedsheet in warm terracotta tones.',
  20, ARRAY['handloom','cotton'], ARRAY['festive'], true, 'Cotton', '6304', 5.0, 4.5, 0),
('d1', 'handloom-cotton-napkins-set-of-6', 'Handloom Cotton Napkins - Set of 6', 'home-essentials', 'kitchen-linen', 499, 699,
  'https://images.pexels.com/photos/6489663/pexels-photo-6489663.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'Elegant handloom cotton napkins for daily dining. Set of 6.',
  45, ARRAY['napkin','cotton'], ARRAY['new-arrival'], false, 'Cotton', '6304', 5.0, 4.5, 0),
('d2', 'cotton-kitchen-apron', 'Cotton Kitchen Apron', 'home-essentials', 'kitchen-linen', 449, 599,
  'https://images.pexels.com/photos/4033327/pexels-photo-4033327.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'Durable cotton apron with adjustable strap and pockets.',
  55, ARRAY['apron','kitchen'], ARRAY['bestseller'], true, 'Cotton', '6304', 5.0, 4.5, 0),
('d3', 'table-runner-woven-cotton', 'Table Runner - Woven Cotton', 'home-essentials', 'kitchen-linen', 699, 899,
  'https://images.pexels.com/photos/6996085/pexels-photo-6996085.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'Hand-woven cotton table runner for an elegant dining table.',
  30, ARRAY['runner','dining'], ARRAY['new-arrival'], false, 'Cotton', '6304', 5.0, 4.5, 0)
ON CONFLICT (id) DO NOTHING;

-- Banners
INSERT INTO public.banners (title, subtitle, image, cta_text, cta_link, display_order, active)
SELECT 'Sacred Weaves · Everyday Grace', 'Handloom sarees and home essentials crafted with care',
  'https://images.unsplash.com/photo-1619516388835-2b60acc4049e?q=80&w=1600',
  'Shop Sarees', '/shop?category=sarees', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.banners LIMIT 1);

INSERT INTO public.banners (title, subtitle, image, cta_text, cta_link, display_order, active)
SELECT 'Festive Edit is Live', 'Discover bestsellers for every celebration',
  'https://images.pexels.com/photos/6480707/pexels-photo-6480707.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'Explore', '/shop', 2, true
WHERE (SELECT COUNT(*) FROM public.banners) < 2;

-- CMS
INSERT INTO public.cms_pages (slug, title, html_content) VALUES
('return-policy', 'Return Policy',
 '<h2>7-Day Returns</h2><p>Returns and exchanges within 7 days of delivery for unused items with tags intact.</p>'),
('shipping-policy', 'Shipping Policy',
 '<h2>Shipping</h2><p>Free shipping on orders above ₹999. Standard delivery in 5–7 business days across India.</p>'),
('size-guide', 'Size Guide',
 '<h2>Size Guide</h2><p>Sarees are free size. For daily wear, refer to the size chart on each product page.</p>'),
('about', 'About Nityavastra',
 '<h2>About Us</h2><p>Nityavastra brings sacred weaves and everyday grace — handloom sarees, daily wear, and home essentials from India''s finest artisans.</p>'),
('contact', 'Contact',
 '<h2>Contact</h2><p>Call +91-87777-87700. Based in Bhubaneswar, Odisha.</p>')
ON CONFLICT (slug) DO NOTHING;

-- Coupons
INSERT INTO public.coupons (code, type, value, min_order, max_discount, active) VALUES
('WELCOME10', 'percent', 10, 999, 500, true),
('FLAT200', 'flat', 200, 1999, NULL, true),
('NITYA20', 'percent', 20, 1499, 1000, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.store_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
