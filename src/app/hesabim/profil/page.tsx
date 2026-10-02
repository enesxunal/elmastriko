import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import AccountShell from "@/components/AccountShell";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/auth/actions";

export default async function AccountProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hesabim");
  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();

  return <><StoreHeader/><AccountShell name={profile?.full_name || user.email || "Hesabım"} email={user.email || ""} current="/hesabim/profil">
    <div className="account-section-head"><span>PROFİL</span><h1>Profil bilgilerim</h1><p>İletişim ve hesap bilgilerinizi burada yönetin.</p></div>
    {(params.error || params.message) && <div className={"auth-message " + (params.error ? "error" : "")}>{params.error || params.message}</div>}
    <div className="account-panel account-page-card account-narrow-card">
      <form className="account-form" action={updateProfile}>
        <input type="hidden" name="return_to" value="/hesabim/profil"/>
        <label>Ad Soyad<input name="full_name" defaultValue={profile?.full_name || ""} placeholder="Ad Soyad" required/></label>
        <label>E-posta<input value={user.email || ""} disabled/></label>
        <label>Telefon<input name="phone" defaultValue={profile?.phone || ""} placeholder="Telefon"/></label>
        <button type="submit">Bilgileri Güncelle</button>
      </form>
    </div>
  </AccountShell><StoreFooter/></>;
}
