import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { addAddress, deleteAddress, requestPasswordReset, signIn, signOut, signUp, updateProfile } from "@/app/auth/actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const [{ data: profile }, { data: orders }, { data: addresses }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
      supabase.from("orders").select("id, order_no, status, grand_total, currency, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("addresses").select("id, title, full_name, phone, city, district, postal_code, address_line, is_default").order("is_default", { ascending: false }).order("created_at", { ascending: false }),
    ]);

    return <><StoreHeader/><main className="account-dashboard">
      <section className="account-welcome">
        <span>ELMAS HESABIM</span>
        <h1>{profile?.full_name || user.email}</h1>
        <p>{user.email}</p>
        <form action={signOut}><button>Çıkış Yap</button></form>
      </section>

      {(params.error || params.message) && <div className={"auth-message " + (params.error ? "error" : "")}>{params.error || params.message}</div>}

      <section className="account-panels">
        <div className="account-panel account-orders">
          <span>01</span><h2>Siparişlerim</h2>
          {orders && orders.length > 0 ? orders.map(order => <div className="order-row" key={order.id}>
            <div><b>{order.order_no}</b><small>{new Date(order.created_at).toLocaleDateString("tr-TR")}</small></div>
            <div><span>{order.status}</span><b>{Number(order.grand_total).toLocaleString("tr-TR")} {order.currency}</b></div>
          </div>) : <p>Henüz siparişiniz bulunmuyor.</p>}
        </div>

        <div className="account-panel">
          <span>02</span><h2>Profilim</h2>
          <form className="account-form" action={updateProfile}>
            <input name="full_name" defaultValue={profile?.full_name || ""} placeholder="Ad Soyad" required/>
            <input name="phone" defaultValue={profile?.phone || ""} placeholder="Telefon"/>
            <button type="submit">Bilgileri Güncelle</button>
          </form>
        </div>

        <div className="account-panel">
          <span>03</span><h2>Favorilerim</h2>
          <p>Beğendiğiniz ürünler hesabınızla eşitlenir.</p>
          <a href="/favoriler">Favori ürünleri görüntüle →</a>
        </div>
      </section>

      <section className="address-section">
        <div className="address-head"><span>04 / ADRESLER</span><h2>Teslimat adresleri</h2></div>
        <div className="address-layout">
          <div className="address-list">
            {addresses && addresses.length > 0 ? addresses.map(address => <article className="address-card" key={address.id}>
              <div><span>{address.is_default ? "VARSAYILAN" : "ADRES"}</span><h3>{address.title}</h3></div>
              <p><b>{address.full_name}</b><br/>{address.address_line}<br/>{address.district} / {address.city}{address.postal_code ? " · " + address.postal_code : ""}{address.phone ? <><br/>{address.phone}</> : null}</p>
              <form action={deleteAddress}><input type="hidden" name="id" value={address.id}/><button type="submit">Adresi Sil</button></form>
            </article>) : <div className="address-empty">Kayıtlı adresiniz bulunmuyor.</div>}
          </div>

          <form className="address-form" action={addAddress}>
            <h3>Yeni adres ekle</h3>
            <div className="form-grid">
              <input name="title" placeholder="Adres başlığı" required/>
              <input name="full_name" defaultValue={profile?.full_name || ""} placeholder="Ad Soyad" required/>
              <input name="phone" defaultValue={profile?.phone || ""} placeholder="Telefon"/>
              <input name="city" placeholder="İl" required/>
              <input name="district" placeholder="İlçe" required/>
              <input name="postal_code" placeholder="Posta kodu"/>
              <input className="full" name="address_line" placeholder="Açık adres" required/>
            </div>
            <label className="check-row"><input type="checkbox" name="is_default"/> Varsayılan adres yap</label>
            <button type="submit">Adresi Kaydet</button>
          </form>
        </div>
      </section>
    </main><StoreFooter/></>;
  }

  return <><StoreHeader/><main className="account-page">
    <div>
      <span>ELMAS HESABIM</span>
      <h1>Tekrar hoş geldiniz.</h1>
      <p>Üyeler siparişlerini, adreslerini ve favorilerini buradan yönetebilir. Üyeliksiz alışveriş seçeneği checkout içinde açık kalacaktır.</p>
      {params.error && <div className="auth-message error">{params.error}</div>}
      {params.message && <div className="auth-message">{params.message}</div>}
      <form className="reset-form" action={requestPasswordReset}><input name="email" type="email" placeholder="Şifre yenileme için e-posta" required/><button type="submit">Şifre Bağlantısı Gönder</button></form>
    </div>
    <div className="auth-columns">
      <form action={signIn}><h2>Giriş Yap</h2><input name="email" type="email" placeholder="E-posta" required/><input name="password" type="password" placeholder="Şifre" minLength={6} required/><button type="submit">Giriş Yap</button></form>
      <form action={signUp}><h2>Hesap Oluştur</h2><input name="full_name" placeholder="Ad Soyad" required/><input name="email" type="email" placeholder="E-posta" required/><input name="password" type="password" placeholder="Şifre (en az 6 karakter)" minLength={6} required/><button type="submit">Kayıt Ol</button></form>
    </div>
  </main><StoreFooter/></>;
}
