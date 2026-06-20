import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth";
export async function GET() {
  const supabase = createClient();
  const {data,error} = await supabase.from("products").select("*,categories(name,is_active)").order("sort_order",{ascending:true});
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({data});
}
export async function POST(req:Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await req.json().catch(()=>null);
  if (!body?.name) return NextResponse.json({error:"Name is required."},{status:400});
  const supabase = createClient();
  const {data,error} = await supabase.from("products").insert({name:body.name,description:body.description??"",price:Number(body.price)||0,category_id:body.category_id||null,image_url:body.image_url??"",occasions:Array.isArray(body.occasions)?body.occasions:[],is_eggless:!!body.is_eggless,badge:body.badge??"",rating:Number(body.rating)||4.8,is_active:body.is_active!==false,sort_order:Number(body.sort_order)||0}).select().single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({data},{status:201});
}
