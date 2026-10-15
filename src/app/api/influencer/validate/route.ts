import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const code = String(request.nextUrl.searchParams.get("code") ?? request.cookies.get("et_affiliate_code")?.value ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{3,32}$/.test(code)) return NextResponse.json({ valid: false }, { headers: { "Cache-Control": "no-store" } });
  const { data, error } = await createAdminClient().from("influencers").select("code,slug,discount_percent").eq("code", code).eq("status", "active").not("email", "is", null).maybeSingle();
  return NextResponse.json(error || !data
    ? { valid: false }
    : { valid: true, code: data.code, slug: data.slug, percent: Number(data.discount_percent) },
    { headers: { "Cache-Control": "no-store" } });
}
