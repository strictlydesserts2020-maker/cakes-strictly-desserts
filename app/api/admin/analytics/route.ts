import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAccessToken(): Promise<string> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
  const key = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })).toString("base64url");
  const { createSign } = await import("crypto");
  const sig = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(key.private_key, "base64url");
  const jwt = `${header}.${payload}.${sig}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error("Token error: " + JSON.stringify(d));
  return d.access_token;
}

async function ga4Report(token: string, prop: string, body: object) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/${prop}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabase.from("admin_users").select("id").eq("id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prop = process.env.GA4_PROPERTY_ID;
  if (!prop || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ configured: false });
  }

  try {
    const token = await getAccessToken();
    const dr = [{ startDate: "30daysAgo", endDate: "today" }];

    const [sessR, evtR, catR, lpR] = await Promise.all([
      ga4Report(token, prop, { dateRanges: dr, metrics: [{ name: "sessions" }, { name: "totalUsers" }] }),
      ga4Report(token, prop, {
        dateRanges: dr,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["order_now_click","whatsapp_click","contact_form_submit","cake_category_click","view_item"] } } },
      }),
      ga4Report(token, prop, {
        dateRanges: dr,
        dimensions: [{ name: "eventName" }, { name: "customEvent:label" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "cake_category_click" } } },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 6,
      }),
      ga4Report(token, prop, {
        dateRanges: dr,
        dimensions: [{ name: "landingPage" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 5,
      }),
    ]);

    const sessions = parseInt(sessR.rows?.[0]?.metricValues?.[0]?.value ?? "0");
    const users = parseInt(sessR.rows?.[0]?.metricValues?.[1]?.value ?? "0");
    const em: Record<string, number> = {};
    (evtR.rows ?? []).forEach((r: any) => { em[r.dimensionValues[0].value] = parseInt(r.metricValues[0].value); });

    const orderClicks = em["order_now_click"] ?? 0;
    const waClicks = em["whatsapp_click"] ?? 0;
    const formSubmits = em["contact_form_submit"] ?? 0;
    const categoryClicks = em["cake_category_click"] ?? 0;
    const productViews = em["view_item"] ?? 0;

    return NextResponse.json({
      configured: true,
      period: "Last 30 days",
      sessions, users,
      orderClickRate: sessions ? ((orderClicks / sessions) * 100).toFixed(1) : "0.0",
      waConversionRate: sessions ? ((waClicks / sessions) * 100).toFixed(1) : "0.0",
      leadRate: sessions ? ((formSubmits / sessions) * 100).toFixed(1) : "0.0",
      orderClicks, waClicks, formSubmits, categoryClicks, productViews,
      categories: (catR.rows ?? []).map((r: any) => ({ name: r.dimensionValues[1].value, count: parseInt(r.metricValues[0].value) })),
      landingPages: (lpR.rows ?? []).map((r: any) => ({ page: r.dimensionValues[0].value || "/", sessions: parseInt(r.metricValues[0].value) })),
    });
  } catch (e: any) {
    return NextResponse.json({ configured: true, error: e.message }, { status: 500 });
  }
}
