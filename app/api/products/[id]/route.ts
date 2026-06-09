import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth";
export async function PATCH(req:Request,{params}:{params:{id:string}}) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await req.json().catch(()=>({}));
  const patch:Record<string,unknown>={};
  for (const k of ["name","description","price","category_id","image_url","occasions","is_eggless","badge","rating","is_active","sort_order"]) if (k in body) patch[k]=body[k];
  const supabase = createClient();
  const {data,error} = await supabase.from("products").update(patch).eq("id",params.id).select().single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({data});
}
export async function DELETE(_req:Request,{params}:{params:zid:string}}) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabase = createClient();
  const {error} = await supabase.from("products").delete().eq("id",params.id);
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true});
}
