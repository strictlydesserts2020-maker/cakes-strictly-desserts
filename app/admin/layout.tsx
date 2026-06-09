import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";
export const dynamic = "force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}) {
  const supabase = createClient();
  const {data:{user:suser}} = await supabase.auth.getUser();
  if (!suser) return <>{children}</>;
  const {data:adminRow} = await supabase.from("admin_users").select("id").eq("id",suser.id).maybeSingle();
  if (!adminRow) { await supabase.auth.signOut(); redirect("/admin/login?error=not_admin"); }
  return (<div className="admin-shell"><AdminNav email={suser.email??""} /><main className="admin-main">{children}</main></div>);
}
