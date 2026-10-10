import { authErrorTR } from "@/lib/auth-error-tr";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import PasswordInput from "@/components/PasswordInput";
import Link from "next/link";
import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { signUp } from "@/app/auth/actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/hesabim");

  return <><StoreHeader/><main className="account-auth-page">
    <section className="account-auth-intro">
      <span>ELMAS HESABIM</span>
      <h1>Hesap oluşturun.</h1>
      <p>Siparişlerinizi takip etmek, adreslerinizi saklamak ve favorilerinizi eşitlemek için hesabınızı oluşturun.</p>
    </section>
    <section className="account-auth-card">
      <span>KAYIT</span>
      <h2>Hesap Oluştur</h2>
      {params.error && <div className="auth-message error">{authErrorTR({message:params.error})}</div>}
      {params.message && <div className="auth-message">{params.message}</div>}
      <form action={signUp} className="account-auth-form">
        <input type="hidden" name="return_to" value="/hesabim/kayit"/>
        <input aria-label="Kayıt ad soyad" name="full_name" placeholder="Ad Soyad" required/>
        <input aria-label="Kayıt e-posta" name="email" type="email" placeholder="E-posta" required/>
        <PasswordInput aria-label="Kayıt şifre" name="password" placeholder="Şifre (en az 6 karakter)" minLength={6} required/>
        <AuthSubmitButton label="Hesap Oluştur" pendingLabel="Kaydınız oluşturuluyor..."/>
      </form>
      <div className="account-auth-links single"><Link href="/hesabim">Zaten hesabım var → Giriş yap</Link></div>
    </section>
  </main><StoreFooter/></>;
}
