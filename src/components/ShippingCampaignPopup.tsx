"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Truck, X } from "lucide-react";
import { useShippingCampaign } from "@/hooks/useShippingCampaign";
import { canShowShippingPopup, POPUP_STORAGE_KEY, POPUP_COOLDOWN } from "@/lib/shipping-campaign";

function rememberShown(now: number) {
  let saved = false;
  try { localStorage.setItem(POPUP_STORAGE_KEY, String(now)); saved = true; } catch {}
  try {
    document.cookie = `${POPUP_STORAGE_KEY}=${now}; Max-Age=${POPUP_COOLDOWN / 1000}; Path=/; SameSite=Lax; Secure`;
    saved ||= document.cookie.includes(`${POPUP_STORAGE_KEY}=${now}`);
  } catch {}
  return saved;
}
function lastShown() {
  let stored = 0;
  try { stored = Number(localStorage.getItem(POPUP_STORAGE_KEY)) || 0; } catch {}
  const cookie = document.cookie.split("; ").find(row => row.startsWith(POPUP_STORAGE_KEY + "="));
  return Math.max(stored, Number(cookie?.split("=")[1]) || 0);
}
export default function ShippingCampaignPopup() {
  const active = useShippingCampaign();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const excluded = /^\/(checkout|sepet|odeme|yonetim|hesabim|auth|influencer|siparis-basarili|siparis-takip)(\/|$)/.test(pathname || "");
  useEffect(() => {
    if (!active || excluded) return;
    const timer = window.setTimeout(() => {
      if (canShowShippingPopup(lastShown()) && rememberShown(Date.now())) setVisible(true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [active, excluded, pathname]);
  if (!active || excluded || !visible) return null;
  return <aside className="shipping-campaign-dialog shipping-campaign-toast" role="status" aria-label="Ücretsiz kargo duyurusu">
    <div className="shipping-campaign-inner">
      <button type="button" className="shipping-campaign-close" aria-label="Duyuruyu kapat" onClick={() => setVisible(false)}><X size={20}/></button>
      <span className="shipping-campaign-eyebrow">ELMAS TRİKO · EKİM FIRSATI</span>
      <div className="shipping-campaign-icon"><Truck size={24} strokeWidth={1.4}/></div>
      <h2 id="shipping-campaign-title">Kargo bizden.</h2>
      <p id="shipping-campaign-description">31 Ekim sonuna kadar tüm siparişlerde <strong>kargo ücretsiz.</strong></p>
      <p className="shipping-campaign-detail">Minimum sepet tutarı yok. Otomatik uygulanır.</p>
      <button type="button" className="shipping-campaign-continue" onClick={() => setVisible(false)}>Alışverişe devam et →</button>
      <small>31 Ekim 2026, 23.59’a kadar · Türkiye içi gönderimler</small>
    </div>
  </aside>;
}
