import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
export const dynamic = "force-dynamic";
export default async function AdminHome() {
const supabase = createClient();
const [{count:products},{count:activeProducts},{count:categories},{count:enquiries},{count:newEnquiries}] = await Promise.all([
supabase.from("products").select("*",{count:"exact",head:true}),
supabase.from("products").select("*",{count:"exact",head:true}).eq("is_active",true),
supabase.from("categories").select("*",{count:"exact",head:true}),
supabase.from("enquiries").select("*",{count:"exact",head:true}),
supabase.from("enquiries").select("*",{count:"exact",head:true}).eq("is_handled",false),
]);
return (<><h1 className="admin-h1">Overview</h1><p className="admin-sub">Manage your storefront</p><div className="admin-grid" style={{marginBottom:"1.6rem"}}>{[[products??0,"Total products"],[activeProducts??0,"Active products"],[categories??0,"Categories"],[enquiries??0,"Enquiries"],[newEnquiries??0,"New enquiries"]].map(([b,s])=>(<div className="stat" key={String(s)}><b>{String(b)}</b><span>{String(s)}</span></div>))}</div><div className="admin-card"><h2 style={{fontFamily:"var(--font-d)",fontSize:"1.2rem",color:"var(--cream)",marginBottom:".8rem"}}>Quick actions</h2><div className="row-actions"><Link className="btn btn-gold" href="/admin/products">Manage products</Link><Link className="btn btn-ghost" href="/admin/categories">Manage categories</Link><Link className="btn btn-ghost" href="/admin/enquiries">View enquiries</Link></div></div><AnalyticsDashboard /></>);
}
