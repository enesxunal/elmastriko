import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_HASH = "16145e0f29680c09a7f4a621f2dee522fec4d19026a49fb3d05d15c8fb434820";
const TEST_SLUG = "elmas-urun-9";

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
  const { data: product, error: readError } = await supabase
    .from("products")
    .select("id,slug,name,base_price")
    .eq("slug", TEST_SLUG)
    .maybeSingle();

  if (readError || !product) {
    return NextResponse.json({ error: readError?.message || "Product not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({ base_price: 1, updated_at: new Date().toISOString() })
    .eq("id", product.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    slug: product.slug,
    name: product.name,
    previousPrice: product.base_price,
    testPrice: 1,
  });
}
