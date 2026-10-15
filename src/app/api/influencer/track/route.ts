import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Geçersiz kaynak." }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as { ref?: string } | null;
  const ref = String(body?.ref || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{2,40}$/.test(ref)) return NextResponse.json({ valid: false }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("influencers").select("id,code,discount_percent").eq("slug", ref).eq("status", "active").not("email", "is", null).maybeSingle();
  if (error || !data) return NextResponse.json({ valid: false }, { status: 404 });
  const visitorId = request.cookies.get("et_affiliate_visitor")?.value || randomBytes(16).toString("hex");
  const visitorHash = createHash("sha256").update(data.id + ":" + visitorId + ":" + String(process.env.SUPABASE_SERVICE_ROLE_KEY)).digest("hex");
  const date = new Date().toISOString().slice(0,10);
  await admin.from("influencer_clicks").upsert(
    { influencer_id: data.id, visitor_hash: visitorHash, visit_day: date },
    { onConflict: "influencer_id,visitor_hash,visit_day", ignoreDuplicates: true }
  );
  const res = NextResponse.json({ valid: true, code: data.code, percent: Number(data.discount_percent) });
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };
  res.cookies.set("et_affiliate_visitor",visitorId,options);
  res.cookies.set("et_affiliate_code",data.code,options);
  return res;
}
