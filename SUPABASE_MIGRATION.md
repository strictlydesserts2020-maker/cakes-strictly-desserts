# Supabase move — 26 Nov 2026

The original Supabase project (`mtbwcwnswpouumhghzhr`, Singapore) was restricted on the Free plan
after exceeding its cached-egress quota (product photos were served from Supabase Storage).

## What changed

- **New Supabase project:** `etlqctltvgzxoyccapxu` (org "Strictly Desserts", region Mumbai / ap-south-1).
- Schema, RLS policies, storage buckets, categories, products, flavours, hamper categories and
  enquiries were copied from the old project on 26 Nov 2026.
- Admin user `strictlydesserts2020@gmail.com` recreated; a trigger (`grant_sd_admin`) adds it to
  `admin_users` automatically.
- Vercel env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
  `SUPABASE_SERVICE_ROLE_KEY` now point to the new project.
- Product photos are served from `public/catalog/` (Vercel CDN), not Supabase Storage.
- Storefront pages are cached (ISR, 5 min) and fall back to `data/catalog.json` if Supabase is down.

## Notes

- The 4 Father's Day bentos are inactive (their photos were not recoverable).
- The old project is kept untouched as a backup.
