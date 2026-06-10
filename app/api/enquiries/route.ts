import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/auth";
import { cleanText, validEmailOrPhone } from "@/lib/utils";
export async function POST(req:Request) {
  let body:any;
  try { body = await req.json(); } catch { return NextResponse.json({error:"Invalid JSON"},{status:400}); }
  const name=cleanText(body?.name,60),contact=cleanText(body?.contact,80),message=cleanText(body?.message,4000),category=cleanText(body?.category,60),source=body?.source==="customise"?"customise":"contact",payload=typeof body?.payload==="object"&&body?.payload?body.payload:{};
  if (!name||!message) return NextResponse.json({error:"Name and message are required."},{status:400});
  if (contact&&!validEmailOrPhone(contact)) return NextResponse.json({error:"Invalid contact."},{status:400});
  const supabase=process.env.SUPABASE_SERVICE_ROLE_KEY?createAdminClient():createClient();
  const {error} = await supabase.from("enquiries").insert({name,contact,message,category,source,payload});
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true},{status:201});
}
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabase = createClient();
  const {data,error} = await supabase.from("enquiries").select("*").order("created_at",{ascending:false});
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({data});
}

export async function PATCH(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { id, order_status, final_payment, delivery_date, is_handled } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const update: Record<string, unknown> = {};
  if (order_status !== undefined) {
    if (!["pending", "accepted", "rejected"].includes(order_status)) return NextResponse.json({ error: "Invalid order_status" }, { status: 400 });
    update.order_status = order_status;
  }
  if (final_payment !== undefined) update.final_payment = final_payment === "" ? null : Number(final_payment);
  if (delivery_date !== undefined) update.delivery_date = delivery_date === "" ? null : delivery_date;
  if (is_handled !== undefined) update.is_handled = Boolean(is_handled);
  const supabase = createAdminClient();
  const { error } = await supabase.from("enquiries").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
