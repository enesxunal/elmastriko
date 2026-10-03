"use client";

import { useState } from "react";
import { BANK_TRANSFER, bankTransferStatusLabel } from "@/lib/payments/bank-transfer";

type Props = {
  orderId: string;
  orderNo: string;
  initialStatus?: string | null;
  compact?: boolean;
};

export default function BankTransferPaymentCard({ orderId, orderNo, initialStatus = "pending", compact = false }: Props) {
  const [status, setStatus] = useState(initialStatus || "pending");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const notified = status === "customer_notified";
  const paid = status === "paid";

  async function notifyPayment() {
    if (busy || paid || notified) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/payments/eft/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderNo }),
      });
      const body = await response.json().catch(() => ({})) as { status?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Ödeme bildirimi gönderilemedi.");
      setStatus(body.status || "customer_notified");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ödeme bildirimi gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return <section className={"bank-transfer-card" + (compact ? " compact" : "")}>
    <div className="bank-transfer-head">
      <div><span>EFT / HAVALE</span><h3>Banka transferi</h3></div>
      <b className={"bank-transfer-status " + (paid ? "paid" : notified ? "notified" : "")}>{bankTransferStatusLabel(status)}</b>
    </div>
    <div className="bank-transfer-details">
      <p><span>Banka</span><strong>{BANK_TRANSFER.bankName}</strong></p>
      <p><span>Hesap sahibi</span><strong>{BANK_TRANSFER.accountHolder}</strong></p>
      <p><span>IBAN</span><strong className="bank-transfer-iban">{BANK_TRANSFER.iban}</strong></p>
      <p><span>Açıklama</span><strong>{orderNo}</strong></p>
    </div>
    <div className="bank-transfer-note"><b>Önemli:</b> Havale/EFT açıklamasına sipariş kodunuz olan <strong>{orderNo}</strong> bilgisini aynen yazın.</div>
    {!paid && <button type="button" className="bank-transfer-notify" onClick={notifyPayment} disabled={busy || notified}>
      {busy ? "Bildirim gönderiliyor..." : notified ? "Ödeme bildirimi gönderildi" : "Ödemeyi yaptım"}
    </button>}
    {notified && <p className="bank-transfer-help">Ödeme bildiriminiz alındı. Siparişiniz, banka hesabı kontrol edildikten sonra onaylanacak.</p>}
    {status === "rejected" && <p className="bank-transfer-help warning">Ödeme henüz hesapta bulunamadı. Transferi kontrol edip tekrar “Ödemeyi yaptım” ile bildirebilirsiniz.</p>}
    {paid && <p className="bank-transfer-help success">Ödemeniz yönetici tarafından onaylandı.</p>}
    {error && <p className="checkout-error-box">{error}</p>}
  </section>;
}
