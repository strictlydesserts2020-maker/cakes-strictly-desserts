import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { dataUri, fileName } = body;
  if (!dataUri || typeof dataUri !== "string") {
    return NextResponse.json({ error: "Missing dataUri" }, { status: 400 });
  }

  // dataUri = "data:<mime>;base64,<data>"
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid data URI" }, { status: 400 });

  const [, mimeType, base64Data] = match;
  const buffer = Buffer.from(base64Data, "base64");

  const ext = (fileName as string | undefined)?.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("ref-images")
    .upload(safeName, buffer, { contentType: mimeType, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("ref-images").getPublicUrl(data.path);
  return NextResponse.json({ url: publicUrl });
}
