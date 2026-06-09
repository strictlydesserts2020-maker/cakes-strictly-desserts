-- ============================================================
--  Cakes by Strictly Desserts — demo seed data
--  Mirrors the categories & products from the original site.
--  Run AFTER schema.sql. Optional — delete rows later from the dashboard.
-- ============================================================

-- ---------- Categories ----------
insert into public.categories (name, slug, description, image_url, sort_order, is_active) values
  ('Birthday',    'birthday',    'Candles, confetti & custom toppers for every age.', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=700&q=72', 1, true),
  ('Wedding',     'wedding',     'Elegant tiered cakes for your big day.',            'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=700&q=72', 2, true),
  ('Bento',       'bento',       'Mini personalised cakes, ready in hours.',          'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=700&q=72', 3, true),
  ('Cupcakes',    'cupcakes',    'Boxes of soft, freshly-frosted cupcakes.',          'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=700&q=72', 4, true),
  ('Luxury',      'luxury',      'Macarons, towers & signature showpieces.',          'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=700&q=72', 5, true),
  ('Anniversary', 'anniversary', 'Romantic cakes to mark the milestones.',            'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=700&q=72', 6, true)
on conflict (slug) do nothing;

-- ---------- Products ----------
insert into public.products
  (name, description, price, category_id, image_url, occasions, is_eggless, badge, rating, sort_order, is_active)
values
  ('Classic Belgian Chocolate', 'Rich Belgian chocolate sponge, made fresh to order.', 1299,
     (select id from public.categories where slug='birthday'),
     'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=72',
     '{Birthday}', false, 'Bestseller', 4.9, 1, true),

  ('Birthday Confetti', 'Vanilla confetti sponge with a colourful finish.', 1599,
     (select id from public.categories where slug='birthday'),
     'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=700&q=72',
     '{Birthday,"Baby Shower"}', true, '', 4.8, 2, true),

  ('Strawberry Bento', 'Mini personalised bento cake, ready in hours.', 699,
     (select id from public.categories where slug='bento'),
     'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=700&q=72',
     '{Birthday}', true, 'New', 4.7, 3, true),

  ('Red Velvet Bento', 'Classic red velvet in a cute bento size.', 749,
     (select id from public.categories where slug='bento'),
     'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=700&q=72',
     '{Anniversary}', false, '', 4.8, 4, true),

  ('Vanilla Rose Tier', 'Elegant tiered vanilla showpiece for weddings.', 4499,
     (select id from public.categories where slug='wedding'),
     'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=700&q=72',
     '{Wedding}', false, 'Premium', 5.0, 5, true),

  ('Naked Wedding Cake', 'Rustic naked cake with fresh cream & berries.', 3899,
     (select id from public.categories where slug='wedding'),
     'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=700&q=72',
     '{Wedding}', true, '', 4.9, 6, true),

  ('Pistachio Cupcakes', 'Soft eggless pistachio cupcakes, freshly frosted.', 549,
     (select id from public.categories where slug='cupcakes'),
     'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=700&q=72',
     '{Birthday}', true, 'Eggless', 4.6, 7, true),

  ('Lemon Drizzle Cupcakes', 'Zesty lemon cupcakes with a sweet drizzle.', 499,
     (select id from public.categories where slug='cupcakes'),
     'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=700&q=72',
     '{"Baby Shower"}', false, '', 4.5, 8, true),

  ('Macaron Tower', 'Signature macaron tower for grand occasions.', 2199,
     (select id from public.categories where slug='luxury'),
     'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=700&q=72',
     '{Wedding,Anniversary}', false, 'Premium', 4.9, 9, true),

  ('Anniversary Heart', 'Heart-shaped cake to mark your milestone.', 1399,
     (select id from public.categories where slug='anniversary'),
     'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=700&q=72',
     '{Anniversary}', true, '', 4.8, 10, true),

  ('Choco Truffle Bento', 'Decadent chocolate truffle in a bento size.', 799,
     (select id from public.categories where slug='bento'),
     'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=72',
     '{Birthday,Anniversary}', true, '', 4.7, 11, true),

  ('Floral Buttercream', 'Hand-piped floral buttercream celebration cake.', 2899,
     (select id from public.categories where slug='wedding'),
     'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=700&q=72',
     '{Wedding,Anniversary}', false, '', 4.9, 12, true);
