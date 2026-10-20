"use client";
import { useEffect, useRef } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const excluded = /^\/(checkout|sepet|odeme|yonetim|hesabim|auth|influencer|siparis-basarili|siparis-takip)(\/|$)/.test(pathname || "");
  useEffect(() => {
    if (!active || excluded) return;
    const dialog = dialogRef.current;
    const timer = window.setTimeout(() => {
      if (!dialog || dialog.open || !canShowShippingPopup(lastShown())) return;
      if (rememberShown(Date.now())) dialog.showModal();
    }, 1500);
    return () => { window.clearTimeout(timer); dialog?.close(); };
  }, [active, excluded, pathname]);
  if (!active || excluded) return null;
  return <dialog ref={dialogRef} className="shipping-campaign-dialog" aria-labelledby="shipping-campaign-title" aria-describedby="shipping-campaign-description" onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
    <div className="shipping-campaign-inner">
      <button type="button" className="shipping-campaign-close" aria-label="Duyuruyu kapat" onClick={() => dialogRef.current?.close()}><X size={22}/></button>
      <span className="shipping-campaign-eyebrow">ELMAS TRİKO · EKİM FIRSATI</span>
      <div className="shipping-campaign-icon"><Truck size={34} strokeWidth={1.4}/></div>
      <h2 id="shipping-campaign-title">Kargo bizden.</h2>
      <p id="shipping-campaign-description">31 Ekim sonuna kadar tüm siparişlerde <strong>kargo ücretsiz.</strong></p>
      <p className="shipping-campaign-detail">Minimum sepet tutarı yok. Kod girmenize gerek yok; sepetinize otomatik uygulanır.</p>
      <button type="button" className="shipping-campaign-continue" autoFocus onClick={() => dialogRef.current?.close()}>Alışverişe devam et →</button>
      <small>31 Ekim 2026, 23.59’a kadar · Türkiye içi gönderimler</small>
    </div>
  </dialog>;
}
