/** Customer-facing Supabase Auth messages. Never expose raw provider errors. */
export function authErrorTR(error: { message?: string; code?: string; status?: number }): string {
  const msg = (error.message || "").toLowerCase();
  const code = (error.code || "").toLowerCase();
  if (code.includes("over_email_send_rate_limit") || msg.includes("email rate limit") || msg.includes("email send rate")) return "Şu anda çok fazla doğrulama e-postası gönderildi. Lütfen bir süre sonra tekrar deneyin.";
  if (code.includes("over_request_rate_limit") || code.includes("over_sms_send_rate_limit") || msg.includes("for security purposes") || msg.includes("rate limit") || error.status === 429) {
    const seconds = msg.match(/after (\d+) seconds?/);
    return seconds ? `Güvenlik nedeniyle tekrar denemeden önce ${seconds[1]} saniye bekleyin.` : "Çok fazla deneme yapıldı. Lütfen kısa bir süre sonra tekrar deneyin.";
  }
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "E-posta adresi veya şifre hatalı.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return "E-posta adresinizi doğrulayın. Gelen kutunuzu ve spam klasörünüzü kontrol edin.";
  if (code === "user_already_exists" || msg.includes("already registered") || msg.includes("already exists")) return "Bu e-posta adresiyle zaten bir hesap bulunuyor. Giriş yapabilir veya şifrenizi sıfırlayabilirsiniz.";
  if (code === "weak_password" || msg.includes("password should") || msg.includes("password is too short")) return "Daha güçlü bir şifre belirleyin (en az 8 karakter).";
  if (code === "otp_expired" || code === "otp_disabled" || msg.includes("expired")) return "Doğrulama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.";
  if (code === "same_password") return "Yeni şifreniz mevcut şifrenizden farklı olmalı.";
  if (code === "validation_failed" || msg.includes("invalid email")) return "Geçerli bir e-posta adresi girin.";
  return "İşlem şu anda tamamlanamadı. Lütfen tekrar deneyin. Sorun devam ederse destek@elmastriko.com adresine ulaşın.";
}
