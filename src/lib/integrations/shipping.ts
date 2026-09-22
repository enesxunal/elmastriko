import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/catalog";

export type ShippingQuote = { provider: "BasitKargo"; fee: number; free: boolean; threshold: number };

export function getShippingQuote(subtotal: number): ShippingQuote {
  const free = subtotal >= FREE_SHIPPING_THRESHOLD;
  return {
    provider: "BasitKargo",
    fee: free ? 0 : STANDARD_SHIPPING_FEE,
    free,
    threshold: FREE_SHIPPING_THRESHOLD,
  };
}
