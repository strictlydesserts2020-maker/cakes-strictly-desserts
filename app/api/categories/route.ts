import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order",{ascending:true});
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({data});
}
export async function POST(req:Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await req.json().catch(()=>null);
  if (!body?.name) return NextResponse.json({error:"Name is required."},{status:400});
  const supabase = createClient();
  const {data,error} = await supabase.from("categories").insert({name:body.name,slug:body.slug?slugify(body.slug):slugify(body.name),description:body.description??"",image_url:body.image_url??"",sort_order:Number(body.sort_order)||0,is_active:body.is_active!==false}).select().single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({data},{status:201});
}
