import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { signIn, signOut, signUp } from "@/app/auth/actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
    const { data: orders } = await supabase.from("orders").select("id, order_no, status, grand_total, currency, created_at").order("created_at", { ascending: false }).limit(10);

    return <><StoreHeader/><main className="account-dashboard">
      <section className="account-welcome">
        <span>ELMAS HESABIM</span><h1>{profile?.full_name || user.email}</h1><p>{user.email}</p>
        <form action={signOut}><button>Çıkış Yap</button></form>
      </section>
      <section className="account-panels">
        <div className="account-panel"><span>01</span><h2>Siparişlerim</h2>{orders && orders.length > 0 ? orders.map(order => <div className="order-row" key={order.id}><div><b>{order.order_no}</b><small>{new Date(order.created_at).toLocaleDateString("tr-TR")}</small></div><div><span>{order.status}</span><b>{Number(order.grand_total).toLocaleString("tr-TR")} {order.currency}</b></div></div>) : <p>Henüz siparişiniz bulunmuyor.</p>}</div>
        <div className="account-panel"><span>02</span><h2>Adreslerim</h2><p>Teslimat ve fatura adreslerinizi checkout sırasında kaydedebileceksiniz.</p></div>
        <div className="account-panel"><span>03</span><h2>Favorilerim</h2><a href="/favoriler">Favori ürünleri görüntüle →</a></div>
      </section>
    </main><StoreFooter/></>;
  }

  return <><StoreHeader/><main className="account-page">
    <div><span>ELMAS HESABIM</span><h1>Tekrar hoş geldiniz.</h1><p>Üyeler siparişlerini, adreslerini ve favorilerini buradan yönetebilir. Üyeliksiz alışveriş seçeneği checkout içinde açık kalacaktır.</p>{params.error && <div className="auth-message error">{params.error}</div>}{params.message && <div className="auth-message">{params.message}</div>}</div>
    <div className="auth-columns">
      <form action={signIn}><h2>Giriş Yap</h2><input name="email" type="email" placeholder="E-posta" required/><input name="password" type="password" placeholder="Şifre" minLength={6} required/><button type="submit">Giriş Yap</button></form>
      <form action={signUp}><h2>Hesap Oluştur</h2><input name="full_name" placeholder="Ad Soyad" required/><input name="email" type="email" placeholder="E-posta" required/><input name="password" type="password" placeholder="Şifre (en az 6 karakter)" minLength={6} required/><button type="submit">Kayıt Ol</button></form>
    </div>
  </main><StoreFooter/></>;
}
