"use client";

import { useEffect, useState } from "react";
import { useShippingCampaign } from "./useShippingCampaign";

type CommerceSettings = {
  currency: string;
  freeShippingThreshold: number;
  shippingFee: number | null;
};

const fallback: CommerceSettings = {
  currency: "TRY",
  freeShippingThreshold: 5000,
  shippingFee: null,
};

export function useCommerceSettings() {
  const shippingCampaignActive = useShippingCampaign();
  const [settings, setSettings] = useState<CommerceSettings>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/commerce", { cache: "no-store" });
        if (!response.ok) return;
        const body = await response.json() as Partial<CommerceSettings>;
        if (cancelled) return;
        setSettings({
          currency: typeof body.currency === "string" ? body.currency : fallback.currency,
          freeShippingThreshold: Number.isFinite(Number(body.freeShippingThreshold))
            ? Number(body.freeShippingThreshold)
            : fallback.freeShippingThreshold,
          shippingFee: body.shippingFee === null || body.shippingFee === undefined
            ? null
            : Number(body.shippingFee),
        });
      } catch {
        // Keep the conservative fallback if settings cannot be loaded.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return { ...settings, freeShippingThreshold: shippingCampaignActive ? 0 : settings.freeShippingThreshold, shippingCampaignActive, loading };
}
