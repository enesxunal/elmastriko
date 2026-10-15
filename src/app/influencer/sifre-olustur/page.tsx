import type { Metadata } from "next";
import Link from "next/link";
import PasswordSetForm from "./password-set-form";
import "@/app/influencer/influencer.css";

export const metadata: Metadata = { title: "Influencer Şifre Oluştur", robots: { index: false, follow: false } };
export default async function CreatePassword({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string }> }) {
  const params = await searchParams;
  const valid = typeof params.token_hash === "string" && /^[a-zA-Z0-9_-]{15,300}$/.test(params.token_hash) && ["invite", "recovery"].includes(params.type || "");
  return <main className="affiliate-public-shell"><section className="affiliate-login-card">
    <Link href="/" className="affiliate-mark">ELMAS TRİKO</Link><small>İŞ BİRLİĞİ PROGRAMI</small>
    <h1>{params.type === "recovery" ? "Yeni şifre belirle" : "Influencer şifrenizi oluşturun"}</h1>
    {valid ? <><p>Hesabınıza giriş yapmak için güvenli bir şifre oluşturun. Şifreniz oluşturulduğunda giriş sayfasına yönlendirileceksiniz.</p>
      <PasswordSetForm tokenHash={params.token_hash!} type={params.type as "invite" | "recovery"}/></>
      : <p className="affiliate-alert error" role="alert">Şifre oluşturma bağlantısı geçersiz. Yöneticinizden yeni davet isteyin veya şifrenizi yenileyin.</p>}
    <div className="affiliate-login-links"><Link href="/influencer/giris">Girişe dön</Link><Link href="/influencer/sifremi-unuttum">Şifremi unuttum</Link></div>
  </section></main>;
}
