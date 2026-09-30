import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { tosla } from "@/lib/integrations/tosla";

const TOKEN_HASH = "f495a9dfb9fbae43694adab1aea575045e0e4b20918ac1411a79bdce2243be79";

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

  try {
    const orderId = "SMOKE-" + Date.now();
    const result = await tosla.startHostedThreeD({
      callbackUrl: "https://www.elmastriko.com/api/payments/tosla/callback",
      orderId,
      amountTry: 1,
      installmentCount: 0,
    });

    return NextResponse.json({
      ok: Boolean(result.ThreeDSessionId),
      orderId,
      threeDSessionId: result.ThreeDSessionId || null,
      iframeUrl: result.iframeUrl || null,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 502 });
  }
}
