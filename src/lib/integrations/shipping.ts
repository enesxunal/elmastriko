import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/catalog";

export type ShippingQuote = { provider: "BasitKargo"; fee: number | null; free: boolean; configured: boolean; threshold: number };

export function getShippingQuote(subtotal: number): ShippingQuote {
  const free = subtotal >= FREE_SHIPPING_THRESHOLD;
  return {
    provider: "BasitKargo",
    fee: free ? 0 : STANDARD_SHIPPING_FEE,
    free,
    configured: free || STANDARD_SHIPPING_FEE !== null,
    threshold: FREE_SHIPPING_THRESHOLD,
  };
}
