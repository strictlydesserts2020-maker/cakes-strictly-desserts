import { createClient } from "@/lib/supabase/server";

/**
 * Returns the current admin user, or null.
 * An "admin" = an authenticated Supabase user that has a row in admin_users.
 */
export async function getAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return adminRow ? user : null;
}
