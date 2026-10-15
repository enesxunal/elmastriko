import type { Metadata } from "next";
import Link from "next/link";
import { requestInfluencerPasswordReset } from "../actions";
import "@/app/influencer/influencer.css";

export const metadata: Metadata = { title: "Influencer Şifre Yenileme", robots: { index: false, follow: false } };
export default async function ForgotPassword({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const query = await searchParams;
  return <main className="affiliate-public-shell"><section className="affiliate-login-card">
    <Link href="/" className="affiliate-mark">ELMAS TRİKO</Link><small>İŞ BİRLİĞİ PROGRAMI</small>
    <h1>Şifremi unuttum</h1><p>Kayıtlı e-posta adresinize tek kullanımlık şifre belirleme bağlantısı gönderilir.</p>
    {query.message && <p className="affiliate-alert success" role="status">{query.message}</p>}
    {query.error && <p className="affiliate-alert error" role="alert">{query.error}</p>}
    <form action={requestInfluencerPasswordReset}>
      <label>E-posta adresiniz<input type="email" name="email" required autoComplete="email" placeholder="ornek@mail.com"/></label>
      <button type="submit" className="affiliate-button">Şifre yenileme bağlantısı gönder</button>
    </form>
    <div className="affiliate-login-links"><Link href="/influencer/giris">Girişe dön</Link><Link href="/">Mağazaya dön</Link></div>
  </section></main>;
}
