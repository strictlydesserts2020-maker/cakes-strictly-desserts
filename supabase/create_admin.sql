-- ============================================================
--  Grant admin access to an existing Auth user.
--  1. First create the user in Supabase: Authentication -> Users -> Add user
--     (set email + password, tick "Auto confirm").
--  2. Then run this, replacing the email below.
-- ============================================================
insert into public.admin_users (id, email, full_name)
select id, email, 'Strictly Desserts Admin'
from auth.users
where email = 'vikash211514@gmail.com'   -- <-- change to your admin email
on conflict (id) do nothing;

-- Verify:
select * from public.admin_users;
