"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOGO_DATA_URI } from "@/lib/brand";
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [err,setErr] = useState(params.get("error")==="not_admin"?"That account is not an admin.":"");
  const [busy,setBusy] = useState(false);
  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const supabase = createClient();
    const {data,error} = await supabase.auth.signInWithPassword({email,password});
    if (error||!data.user) { setErr(error?.message||"Login failed."); setBusy(false); return; }
    const {data:adminRow} = await supabase.from("admin_users").select("id").eq("id",data.user.id).maybeSingle();
    if (!adminRow) { await supabase.auth.signOut(); setErr("This account does not have admin access."); setBusy(false); return; }
    router.push(params.get("redirect")||"/admin"); router.refresh();
  };
  return (<div className="login-wrap"><form className="login-card" onSubmit={submit}><img src={LOGO_DATA_URI} alt="Cakes by Strictly Desserts" /><h1>Admin Dashboard</h1><p>Sign in to manage products, categories &amp; enquiries.</p><label className="alabel">Email</label><input className="field" type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" required /><label className="alabel">Password</label><input className="field" type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} required />{err&&<div className="err">{err}</div>}<button className="btn btn-gold" style={{width:"100%",marginTop:"1.4rem"}} type="submit" disabled={busy}>{busy?"Signing in…":"Sign In"}</button></form></div>);
}
export default function LoginPage() { return (<Suspense fallback={<div className="login-wrap" />}><LoginForm /></Suspense>); }
