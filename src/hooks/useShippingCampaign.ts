"use client";
import { useSyncExternalStore } from "react";
import { isShippingCampaignActive } from "@/lib/shipping-campaign";
import { isBlackFridayActive } from "@/lib/black-friday";
function subscribe(listener: () => void) {
  const timer = window.setInterval(listener, 1000);
  window.addEventListener("focus", listener);
  return () => { window.clearInterval(timer); window.removeEventListener("focus", listener); };
}
export function useShippingCampaign() {
  return useSyncExternalStore(subscribe, () => isBlackFridayActive() || isShippingCampaignActive(), () => false);
}
