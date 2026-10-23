export const CHECKOUT_STAGES = [
  "contact_completed", "address_completed", "form_started", "form_invalid", "form_submitted", "order_created", "order_failed",
  "payment_session_created", "payment_session_failed", "card_page_viewed", "card_form_invalid",
  "card_submitted", "payment_verified", "payment_failed", "verification_pending", "eft_started",
] as const;
export type CheckoutStage = typeof CHECKOUT_STAGES[number];
export const CLIENT_CHECKOUT_STAGES = ["form_started", "contact_completed", "address_completed", "form_invalid", "form_submitted", "order_failed", "payment_session_failed"] as const;
export const CHECKOUT_ERRORS = ["validation", "network", "server", "stock", "variant", "price", "shipping", "provider", "database", "unknown"] as const;
export type CheckoutError = typeof CHECKOUT_ERRORS[number];
export type CheckoutDiagnosticContext = { sessionId?: string; attemptId?: string };
export const CHECKOUT_FIELDS = ["firstName", "lastName", "email", "phone", "addressLine", "city", "district", "companyName", "taxOffice", "taxNumber", "invoiceEmail"] as const;
export type CheckoutField = typeof CHECKOUT_FIELDS[number];
export type JourneyStage = CheckoutStage | "product_viewed" | "cart_added" | "cart_viewed" | "checkout_viewed" | "page_visited";
export type JourneyEvent = { id: string; at: string; stage: JourneyStage; path: string | null; product_name: string | null; code: string | null; field_group: string | null; field_name: string | null; provider_code: string | null };
export type CheckoutReport = {
  measurementStartedAt: string;
  detailStartedAt?: string;
  stages: { stage: JourneyStage; sessions: number; events: number }[];
  issues: { stage: JourneyStage; code: string; field_group: string | null; field_name?: string | null; provider_code?: string | null; count: number }[];
  recent: { attempt_id: string; first_at: string; last_at: string; stage: JourneyStage; source: string; device: string; browser: string; payment_status: string | null; order_no: string | null; inactive: boolean; timeline: JourneyEvent[]; event_count: number }[];
};
export const checkoutFieldLabels: Record<string,string> = { firstName:"Ad", lastName:"Soyad", email:"E-posta", phone:"Telefon", addressLine:"Adres", city:"İl", district:"İlçe", companyName:"Firma unvanı", taxOffice:"Vergi dairesi", taxNumber:"Vergi numarası", invoiceEmail:"Fatura e-postası" };
export const checkoutStageLabels: Record<JourneyStage, string> = {
  product_viewed: "Ürün görüntülendi", cart_added: "Sepete eklendi", cart_viewed: "Sepet açıldı", checkout_viewed: "Ödeme sayfası hazır", page_visited: "Sayfa ziyaret edildi",
  contact_completed: "İletişim alanları tamamlandı", address_completed: "Adres alanları tamamlandı", form_started: "Formla etkileşime geçti", form_invalid: "Zorunlu alan / biçim hatası", form_submitted: "Bilgileri gönderdi",
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
