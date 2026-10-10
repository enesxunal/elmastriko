import PasswordInput from "@/components/PasswordInput";
import Link from "next/link";
import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import AccountShell from "@/components/AccountShell";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "@/app/auth/actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; reset?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && params.reset === "1") redirect("/hesabim/guvenlik?reset=1");

  if (user) {
    const [{ data: profile }, { data: orders }, { data: addresses }] = await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
      supabase.from("orders").select("id, order_no, status, grand_total, currency, created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("addresses").select("id").limit(100),
    ]);

    if (profile?.role === "admin") redirect("/yonetim");

    const delivered = (orders || []).filter(order => order.status === "delivered").length;

    return <><StoreHeader/><AccountShell name={profile?.full_name || user.email || "Hesabım"} email={user.email || ""} current="/hesabim">
      <div className="account-section-head"><span>GENEL BAKIŞ</span><h1>Hesabım</h1><p>Sipariş, adres, profil ve güvenlik işlemlerinizi ayrı bölümlerden yönetin.</p></div>
      {(params.error || params.message) && <div className={"auth-message " + (params.error ? "error" : "")}>{params.error || params.message}</div>}
      <div className="account-overview-stats">
        <article><span>Son siparişler</span><strong>{orders?.length || 0}</strong><small>Son 3 kayıt</small></article>
        <article><span>Kayıtlı adres</span><strong>{addresses?.length || 0}</strong><small>Teslimat bilgileri</small></article>
        <article><span>Teslim edildi</span><strong>{delivered}</strong><small>Son siparişler içinde</small></article>
      </div>
      <div className="account-overview-grid">
        <Link href="/hesabim/siparisler" className="account-overview-card"><span>01</span><h2>Siparişlerim</h2><p>Aktif ve geçmiş siparişleriniz, durum adımları ve detaylar.</p><b>Siparişlere git →</b></Link>
        <Link href="/hesabim/adresler" className="account-overview-card"><span>02</span><h2>Adreslerim</h2><p>Teslimat adreslerinizi ekleyin, düzenleyin ve varsayılan adresi seçin.</p><b>Adresleri yönet →</b></Link>
        <Link href="/hesabim/profil" className="account-overview-card"><span>03</span><h2>Profilim</h2><p>Ad, telefon ve temel hesap bilgilerinizi güncelleyin.</p><b>Profili düzenle →</b></Link>
        <Link href="/hesabim/guvenlik" className="account-overview-card"><span>04</span><h2>Güvenlik</h2><p>Şifrenizi ayrı ve sade bir alandan yönetin.</p><b>Güvenliğe git →</b></Link>
      </div>
      <section className="account-recent">
        <div className="account-recent-head"><div><span>SON HAREKETLER</span><h2>Son siparişler</h2></div><Link href="/hesabim/siparisler">Tümünü gör →</Link></div>
        {orders && orders.length > 0 ? orders.map(order => <Link href={"/hesabim/siparis/" + order.id} key={order.id} className="account-recent-row">
          <div><b>{order.order_no}</b><small>{new Date(order.created_at).toLocaleDateString("tr-TR")}</small></div>
          <span>{order.status.replaceAll("_"," ")}</span>
          <strong>{Number(order.grand_total).toLocaleString("tr-TR")} {order.currency}</strong>
        </Link>) : <p>Henüz siparişiniz bulunmuyor.</p>}
      </section>
    </AccountShell><StoreFooter/></>;
  }

  return <><StoreHeader/><main className="account-auth-page">
    <section className="account-auth-intro">
      <span>ELMAS HESABIM</span>
      <h1>Tekrar hoş geldiniz.</h1>
      <p>Hesabınıza giriş yaparak siparişlerinizi, adreslerinizi ve favorilerinizi yönetin.</p>
    </section>
    <section className="account-auth-card">
      <span>GİRİŞ</span>
      <h2>Giriş Yap</h2>
      {params.error && <div className="auth-message error">{params.error}</div>}
      {params.message && <div className="auth-message">{params.message}</div>}
      <form action={signIn} className="account-auth-form">
        <input aria-label="Giriş e-posta" name="email" type="email" placeholder="E-posta" required/>
        <PasswordInput aria-label="Giriş şifre" name="password" placeholder="Şifre" minLength={6} required/>
        <button type="submit">Giriş Yap</button>
      </form>
      <div className="account-auth-links">
        <Link href="/hesabim/kayit">Hesap oluştur</Link>
        <Link href="/hesabim/sifremi-unuttum">Şifremi unuttum</Link>
      </div>
    </section>
  </main><StoreFooter/></>;
}
