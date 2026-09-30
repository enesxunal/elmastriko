import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_HASH = "ecf84094e0e75c591848a93a83029355a252f34d5680955cd3391faac602d859";

function validToken(value: string) {
  const actual = Buffer.from(createHash("sha256").update(value, "utf8").digest("hex"));
  const expected = Buffer.from(TOKEN_HASH);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-test-token") || "";
  if (!validToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: current, error: readError } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "commerce")
    .maybeSingle();

  if (readError || !current) {
    return NextResponse.json({ error: readError?.message || "Commerce settings not found" }, { status: 404 });
  }

  const value = { ...(current.value || {}), shippingFee: 0 };
  const { error: updateError } = await supabase
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", "commerce");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, shippingFee: 0 });
}
