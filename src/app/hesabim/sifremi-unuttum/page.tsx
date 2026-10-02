import Link from "next/link";
import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/hesabim/guvenlik");

  return <><StoreHeader/><main className="account-auth-page">
    <section className="account-auth-intro">
      <span>ELMAS HESABIM</span>
      <h1>Şifrenizi yenileyin.</h1>
      <p>Hesabınıza kayıtlı e-posta adresini girin. Şifre yenileme bağlantısını size gönderelim.</p>
    </section>
    <section className="account-auth-card">
      <span>ŞİFRE YENİLEME</span>
      <h2>Şifremi Unuttum</h2>
      {params.error && <div className="auth-message error">{params.error}</div>}
      {params.message && <div className="auth-message">{params.message}</div>}
      <form action={requestPasswordReset} className="account-auth-form">
        <input type="hidden" name="return_to" value="/hesabim/sifremi-unuttum"/>
        <input name="email" type="email" placeholder="E-posta" required/>
        <button type="submit">Şifre Bağlantısı Gönder</button>
      </form>
      <div className="account-auth-links single"><Link href="/hesabim">Giriş ekranına dön</Link></div>
    </section>
  </main><StoreFooter/></>;
}
