export const BANK_TRANSFER = {
  provider: "bank_transfer",
  bankName: "Ziraat Bankası",
  accountHolder: "ELMAS TRİKO SANAYİ VE TİCARET LİMİTED ŞİRKETİ",
  iban: "TR090001001359983867455001",
} as const;

export function bankTransferStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending: "Ödeme bekleniyor",
    customer_notified: "Müşteri ödeme bildirdi",
    paid: "Ödeme onaylandı",
    rejected: "Ödeme bulunamadı",
    failed: "Ödeme başarısız",
    cancelled: "İptal edildi",
    refunded: "İade edildi",
  };
  return labels[status || "pending"] || status || "Ödeme bekleniyor";
}
