"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BLACK_FRIDAY_END_MS, isBlackFridayActive } from "@/lib/black-friday";

export default function BlackFridayCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // No misleading campaign after expiry, including on pages left open.
  if (now !== null && !isBlackFridayActive(now)) return null;
  const ms = Math.max(0, BLACK_FRIDAY_END_MS - (now ?? BLACK_FRIDAY_END_MS));
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms / 3600000) % 24);
  const minutes = Math.floor((ms / 60000) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  const two = (n: number) => String(n).padStart(2, "0");

  return <div className="bf-countdown" aria-label="Black Friday kampanyası">
    <Link href="/yeni-gelenler" className="bf-countdown-message">
      <strong>BLACK FRIDAY</strong><span>TÜM ÜRÜNLERDE <b>%25 İNDİRİM</b> <em>+</em> ÜCRETSİZ KARGO</span>
    </Link>
    <div className="bf-countdown-clock" aria-label="Kampanyanın bitmesine kalan süre">
      <span className="bf-clock-label">SON</span>
      <span><b>{two(days)}</b><small>GÜN</small></span>
      <i>:</i><span><b>{two(hours)}</b><small>SAAT</small></span>
      <i>:</i><span><b>{two(minutes)}</b><small>DK</small></span>
      <i>:</i><span><b>{two(seconds)}</b><small>SN</small></span>
    </div>
  </div>;
}
