export const CHECKOUT_STAGES = [
  "form_started", "form_invalid", "form_submitted", "order_created", "order_failed",
  "payment_session_created", "payment_session_failed", "card_page_viewed", "card_form_invalid",
  "card_submitted", "payment_verified", "payment_failed", "verification_pending", "eft_started",
] as const;
export type CheckoutStage = typeof CHECKOUT_STAGES[number];
export const CLIENT_CHECKOUT_STAGES = ["form_started", "form_invalid", "form_submitted", "order_failed", "payment_session_failed"] as const;
export const CHECKOUT_ERRORS = ["validation", "network", "server", "stock", "variant", "price", "shipping", "provider", "database", "unknown"] as const;
export type CheckoutError = typeof CHECKOUT_ERRORS[number];
export type CheckoutDiagnosticContext = { sessionId?: string; attemptId?: string };
export type CheckoutReport = {
  measurementStartedAt: string;
  stages: { stage: CheckoutStage; sessions: number; events: number }[];
  issues: { stage: CheckoutStage; code: string; field_group: string | null; provider_code?: string | null; count: number }[];
  recent: { attempt_id: string; last_at: string; stage: CheckoutStage; source: string; device: string; payment_status: string | null; order_no: string | null; inactive: boolean }[];
};
export const checkoutStageLabels: Record<CheckoutStage, string> = {
  form_started: "Bilgi girmeye başladı", form_invalid: "Zorunlu alan / biçim hatası", form_submitted: "Bilgileri gönderdi",
  order_created: "Sipariş oluştu", order_failed: "Sipariş oluşturulamadı", payment_session_created: "Kart oturumu hazır",
  payment_session_failed: "Ödeme başlatılamadı", card_page_viewed: "Kart ekranı açıldı", card_form_invalid: "Kart formunda doğrulama hatası",
  card_submitted: "Kart formu Tosla’ya gönderildi", payment_verified: "Ödeme doğrulandı", payment_failed: "Ödeme başarısız",
  verification_pending: "Ödeme doğrulaması bekleniyor", eft_started: "Havale bilgileri açıldı",
};
export const checkoutErrorLabels: Record<string, string> = {
  validation: "Eksik veya geçersiz alan", network: "Bağlantı kesildi / yanıt alınamadı", server: "Sunucu hatası",
  stock: "Stok yetersiz", variant: "Beden / renk bulunamadı", price: "Fiyat eksik", shipping: "Kargo tutarı belirlenemedi",
  provider: "Ödeme sağlayıcısı hatası", database: "Veritabanı hatası", unknown: "Sınıflandırılamayan hata",
};
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function checkoutErrorCode(message: string): CheckoutError {
  if (/insufficient_stock/.test(message)) return "stock";
  if (/variant_not_found|product_not_found/.test(message)) return "variant";
  if (/price_missing/.test(message)) return "price";
  if (/shipping_fee/.test(message)) return "shipping";
  return "database";
}
