"use client";
import { useShippingCampaign } from "@/hooks/useShippingCampaign";
import { isBlackFridayActive } from "@/lib/black-friday";
export default function ShippingPolicyNotice() {
  const active = useShippingCampaign();
  return <p>{isBlackFridayActive() ? "30 Kasım 2026 sonuna kadar tüm ürünlerde %25 Black Friday indirimi ve Türkiye içi tüm siparişlerde ücretsiz kargo uygulanır." : active ? "31 Ekim 2026 sonuna kadar Türkiye içi tüm siparişlerde kargo ücretsizdir. Minimum sepet tutarı ve kampanya kodu gerekmez." : "5.000 TL ve üzeri siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerin kargo bedeli sepet ve ödeme ekranında gösterilir."}</p>;
}
