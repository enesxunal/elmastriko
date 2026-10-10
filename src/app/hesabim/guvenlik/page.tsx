import PasswordInput from "@/components/PasswordInput";
import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import AccountShell from "@/components/AccountShell";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "@/app/auth/actions";

export default async function AccountSecurityPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hesabim");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  return <><StoreHeader/><AccountShell name={profile?.full_name || user.email || "Hesabım"} email={user.email || ""} current="/hesabim/guvenlik">
    <div className="account-section-head"><span>GÜVENLİK</span><h1>Şifre ve güvenlik</h1><p>Hesabınızın şifresini ayrı bir alandan yönetin.</p></div>
    {(params.error || params.message) && <div className={"auth-message " + (params.error ? "error" : "")}>{params.error || params.message}</div>}
    <div className="account-panel account-page-card account-narrow-card">
      <form className="account-form" action={updatePassword}>
        <input type="hidden" name="return_to" value="/hesabim/guvenlik"/>
        <label>Yeni şifre<PasswordInput name="password" minLength={8} placeholder="En az 8 karakter" autoComplete="new-password" required/></label>
        <label>Yeni şifre tekrar<PasswordInput name="confirm_password" minLength={8} placeholder="Şifreyi tekrar girin" autoComplete="new-password" required/></label>
        <button type="submit">Şifreyi Güncelle</button>
      </form>
    </div>
  </AccountShell><StoreFooter/></>;
}
