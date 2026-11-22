import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

import { isShippingCampaignActive, SHIPPING_CAMPAIGN_END } from "@/lib/shipping-campaign";
import { BLACK_FRIDAY_END_MS, isBlackFridayActive } from "@/lib/black-friday";

const FALLBACK_THRESHOLD = 5000;

export async function GET() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "commerce")
    .maybeSingle();

  const value = (data?.value || {}) as Record<string, unknown>;
  const threshold = Number(value.freeShippingThreshold ?? FALLBACK_THRESHOLD);
  const rawFee = value.shippingFee;
  const shippingFee = rawFee === null || rawFee === undefined || rawFee === ""
    ? null
    : Number(rawFee);

  const blackFriday = isBlackFridayActive();
  const campaignActive = blackFriday || isShippingCampaignActive();
  return NextResponse.json({
    currency: String(value.currency || "TRY"),
    freeShippingThreshold: campaignActive ? 0 : Number.isFinite(threshold) ? threshold : FALLBACK_THRESHOLD,
    shippingCampaignActive: campaignActive,
    shippingCampaignEndsAt: blackFriday ? new Date(BLACK_FRIDAY_END_MS).toISOString() : SHIPPING_CAMPAIGN_END,
    shippingFee: campaignActive ? 0 : shippingFee !== null && Number.isFinite(shippingFee) ? shippingFee : null,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
