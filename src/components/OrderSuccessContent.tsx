"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useStore } from "@/components/StoreProvider";

export default function OrderSuccessContent({ orderNo }: { orderNo: string }) {
  const { clearCart } = useStore();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <main style={{ minHeight: "72vh", background: "#f7f4ee", display: "grid", placeItems: "center", padding: "72px 20px" }}>
      <section style={{ width: "min(720px, 100%)", background: "#fff", padding: "clamp(32px, 6vw, 72px)", textAlign: "center" }}>
        <span style={{ fontSize: 10, letterSpacing: ".18em" }}>ÖDEME ONAYLANDI</span>
        <h1 style={{ font: "400 clamp(44px, 7vw, 76px)/.98 Georgia,serif", margin: "20px 0 22px", letterSpacing: "-.04em" }}>
          Siparişiniz alındı.
        </h1>
        <p style={{ color: "#756d64", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 32px" }}>
          Ödemeniz başarıyla tamamlandı. Siparişiniz hazırlanmak üzere kaydedildi.
        </p>
        {orderNo && (
          <div style={{ borderTop: "1px solid #ddd5ca", borderBottom: "1px solid #ddd5ca", padding: "20px 0", marginBottom: 32 }}>
            <span style={{ display: "block", fontSize: 10, color: "#81786f", marginBottom: 8 }}>SİPARİŞ NO</span>
            <strong style={{ fontSize: 18 }}>{orderNo}</strong>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/hesabim" style={{ background: "#133f33", color: "#fff", padding: "15px 22px", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase" }}>
            Siparişlerimi Gör
          </Link>
          <Link href="/" style={{ border: "1px solid #133f33", padding: "15px 22px", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase" }}>
            Alışverişe Devam Et
          </Link>
        </div>
      </section>
    </main>
  );
}
