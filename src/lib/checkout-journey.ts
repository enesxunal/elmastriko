import { checkoutErrorLabels, checkoutFieldLabels, type CheckoutReport } from "./checkout-diagnostics";
type Journey = CheckoutReport["recent"][number];
export function journeySummary(row: Journey) {
  const stages = new Set(row.timeline.map(e => e.stage));
  if (row.payment_status === "paid" || stages.has("payment_verified")) return "Ödeme onaylandı.";
  if (row.payment_status === "review_required") return "Tahsilat var; stok onayı için kontrol gerekli.";
  const relevant = row.timeline.filter(e => !["page_visited", "product_viewed", "cart_viewed"].includes(e.stage));
  const last = relevant.at(-1);
  if (last?.code) return `${checkoutErrorLabels[last.code] || "Kaydedilen hata"}${last.field_name ? " · " + (checkoutFieldLabels[last.field_name] || "Alan") : ""}.`;
  if (stages.has("card_submitted")) return "Kart formu bankaya gönderildi; doğrulanmış ödeme sonucu yok.";
  if (stages.has("eft_started")) return "Havale bilgileri açıldı; ödeme onayı bekleniyor.";
  if (stages.has("card_page_viewed")) return "Kart ekranı açıldı; kart formu gönderimi kaydedilmedi.";
  if (stages.has("order_created")) return "Sipariş oluştu; sonraki ödeme adımı henüz kaydedilmedi.";
  if (stages.has("form_submitted")) return "Bilgiler gönderildi; sipariş sonucu kaydı yok.";
  if (stages.has("form_started") || stages.has("contact_completed") || stages.has("address_completed")) return "Formla etkileşim var; sipariş gönderimi kaydedilmedi.";
  if (stages.has("checkout_viewed")) return "Ödeme sayfası hazır; form etkileşimi kaydedilmedi.";
  return "Sepete eklendi; ödeme başlangıcı kaydedilmedi.";
}
export function journeyPageLabel(path: string | null) {
  if (!path) return "";
  const labels: Record<string,string> = { "/":"Ana sayfa", "/checkout":"Ödeme sayfası", "/sepet":"Sepet", "/kargo-iade":"Kargo ve iade koşulları", "/hesabim":"Hesap", "/hesabim/kayit":"Üyelik", "/kadin":"Kadın ürünleri", "/erkek":"Erkek ürünleri" };
  return labels[path] || path;
}
