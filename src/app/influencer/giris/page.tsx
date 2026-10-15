import type { Metadata } from "next";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { signInInfluencer } from "../actions";
import "@/app/influencer/influencer.css";

export const metadata: Metadata = { title: "Influencer Girişi", robots: { index: false, follow: false } };
export default async function InfluencerLogin({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const query = await searchParams;
  return <main className="affiliate-public-shell"><section className="affiliate-login-card">
    <Link href="/" className="affiliate-mark">ELMAS TRİKO</Link><small>İŞ BİRLİĞİ PROGRAMI</small>
    <h1>Influencer Girişi</h1><p>Elmas Triko tarafından davet edildiğiniz e-posta ve oluşturduğunuz şifreyle giriş yapın.</p>
    {query.message && <p className="affiliate-alert success" role="status">{query.message}</p>}
    {query.error && <p className="affiliate-alert error" role="alert">{query.error}</p>}
    <form action={signInInfluencer}>
      <label>E-posta adresiniz<input type="email" name="email" required autoComplete="email" placeholder="ornek@mail.com"/></label>
      <label>Şifreniz<PasswordInput name="password" required autoComplete="current-password" placeholder="Şifrenizi girin"/></label>
      <button type="submit" className="affiliate-button">Giriş yap</button>
    </form>
    <div className="affiliate-login-links"><Link href="/influencer/sifremi-unuttum">Şifremi unuttum</Link><Link href="/">Mağazaya dön</Link></div>
    <p className="affiliate-muted">İlk giriş için yöneticinin e-posta adresinize gönderdiği şifre oluşturma bağlantısını kullanın.</p>
  </section></main>;
}
