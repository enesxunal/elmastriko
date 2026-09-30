import StoreHeader from "@/components/StoreHeader";
import Link from "next/link";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { addAddress, deleteAddress, requestPasswordReset, setDefaultAddress, signIn, signOut, signUp, updateAddress, updatePassword, updateProfile } from "@/app/auth/actions";

const orderStatusLabels: Record<string, string> = {
  draft: "Taslak",
  awaiting_payment: "Ödeme bekliyor",
  paid: "Ödeme alındı",
  invoice_pending: "Hazırlanıyor",
  ready_to_ship: "Kargoya hazır",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};

function orderStep(status: string) {
  if (status === "delivered") return 4;
  if (status === "shipped") return 3;
  if (status === "ready_to_ship") return 2;
  if (["paid", "invoice_pending"].includes(status)) return 1;
  return 0;
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; reset?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const [{ data: profile }, { data: orders }, { data: addresses }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
      supabase.from("orders").select("id, order_no, status, grand_total, currency, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("addresses").select("id, title, full_name, phone, city, district, postal_code, address_line, is_default").order("is_default", { ascending: false }).order("created_at", { ascending: false }),
    ]);

    const orderIds = (orders || []).map(order => order.id);
    const { data: orderItems } = orderIds.length
      ? await supabase.from("order_items").select("order_id,product_id,product_name,color,size,quantity").in("order_id", orderIds)
      : { data: [] };
    const productIds = Array.from(new Set((orderItems || []).map(item => item.product_id).filter(Boolean))) as string[];
    const { data: productImages } = productIds.length
      ? await supabase.from("product_images").select("product_id,url,alt_text,sort_order").in("product_id", productIds).order("sort_order", { ascending: true })
      : { data: [] };

    const imageByProduct = new Map<string,string>();
    for (const image of productImages || []) {
      if (image.product_id && !imageByProduct.has(image.product_id)) imageByProduct.set(image.product_id, image.url);
    }
    const itemsByOrder = new Map<string, typeof orderItems>();
    for (const item of orderItems || []) {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }

    return <><StoreHeader/><main className="account-dashboard">
      <section className="account-welcome">
        <div className="account-welcome-copy">
          <span>ELMAS HESABIM</span>
          <h1>{profile?.full_name || user.email}</h1>
          <p>{user.email}</p>
        </div>
        <form action={signOut}><button>Çıkış Yap</button></form>
        <div className="account-quick-stats">
          <div><strong>{orders?.length || 0}</strong><span>Sipariş</span></div>
          <div><strong>{addresses?.length || 0}</strong><span>Kayıtlı adres</span></div>
          <div><strong>{orders?.filter(order => order.status === "delivered").length || 0}</strong><span>Teslim edildi</span></div>
        </div>
      </section>

      {(params.error || params.message) && <div className={"auth-message " + (params.error ? "error" : "")}>{params.error || params.message}</div>}

      {params.reset === "1" && <section className="account-panel password-reset-panel">
        <span>GÜVENLİK</span><h2>Yeni şifre belirle</h2><p>Hesabınız için en az 8 karakterli yeni bir şifre oluşturun.</p>
        <form className="account-form" action={updatePassword}>
          <input name="password" type="password" minLength={8} placeholder="Yeni şifre" autoComplete="new-password" required/>
          <input name="confirm_password" type="password" minLength={8} placeholder="Yeni şifre tekrar" autoComplete="new-password" required/>
          <button type="submit">Şifreyi Güncelle</button>
        </form>
      </section>}

      <section className="account-panels">
        <div className="account-panel account-orders">
          <span>01</span><h2>Siparişlerim</h2>
          {orders && orders.length > 0 ? orders.map(order => {
            const orderProducts = itemsByOrder.get(order.id) || [];
            const firstProduct = orderProducts[0];
            const thumb = firstProduct?.product_id ? imageByProduct.get(firstProduct.product_id) : null;
            const step = orderStep(order.status);
            const terminal = ["cancelled","refunded"].includes(order.status);
            return <Link className="order-row order-history-card" href={"/hesabim/siparis/" + order.id} key={order.id}>
              <div className="order-history-product">
                <div className="order-history-thumb">{thumb ? <img src={thumb} alt={firstProduct?.product_name || "Sipariş ürünü"}/> : <span>ET</span>}</div>
                <div><b>{firstProduct?.product_name || order.order_no}</b><small>{orderProducts.length > 1 ? "+" + (orderProducts.length - 1) + " ürün daha" : firstProduct ? firstProduct.quantity + " adet" + (firstProduct.size ? " · " + firstProduct.size : "") + (firstProduct.color ? " · " + firstProduct.color : "") : new Date(order.created_at).toLocaleDateString("tr-TR")}</small><small>{order.order_no} · {new Date(order.created_at).toLocaleDateString("tr-TR")}</small></div>
              </div>
              <div className="order-history-meta"><span className={terminal ? "order-status danger" : "order-status"}>{orderStatusLabels[order.status] || order.status}</span><b>{Number(order.grand_total).toLocaleString("tr-TR")} {order.currency}</b></div>
              {!terminal && <div className="order-mini-progress" aria-label="Sipariş durumu">
                {["Sipariş","Ödeme","Hazırlık","Kargo","Teslim"].map((label,index)=><span key={label} className={index <= step ? "active" : ""}><i/>{label}</span>)}
              </div>}
            </Link>;
          }) : <p>Henüz siparişiniz bulunmuyor.</p>}
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
              <div className="address-card-head"><div><span>{address.is_default ? "VARSAYILAN" : "ADRES"}</span><h3>{address.title}</h3></div>{address.is_default && <b>✓</b>}</div>
              <p><b>{address.full_name}</b><br/>{address.address_line}<br/>{address.district} / {address.city}{address.postal_code ? " · " + address.postal_code : ""}{address.phone ? <><br/>{address.phone}</> : null}</p>
              <div className="address-card-actions">
                <details className="address-edit">
                  <summary>Düzenle</summary>
                  <form action={updateAddress} className="address-edit-form">
                    <input type="hidden" name="id" value={address.id}/>
                    <input name="title" defaultValue={address.title} placeholder="Adres başlığı" required/>
                    <input name="full_name" defaultValue={address.full_name} placeholder="Ad Soyad" required/>
                    <input name="phone" defaultValue={address.phone || ""} placeholder="Telefon"/>
                    <input name="city" defaultValue={address.city} placeholder="İl" required/>
                    <input name="district" defaultValue={address.district} placeholder="İlçe" required/>
                    <input name="postal_code" defaultValue={address.postal_code || ""} placeholder="Posta kodu"/>
                    <textarea name="address_line" defaultValue={address.address_line} placeholder="Açık adres" required/>
                    <label className="check-row"><input type="checkbox" name="is_default" defaultChecked={address.is_default}/> Varsayılan adres yap</label>
                    <button type="submit">Değişiklikleri Kaydet</button>
                  </form>
                </details>
                {!address.is_default && <form action={setDefaultAddress}><input type="hidden" name="id" value={address.id}/><button type="submit">Varsayılan Yap</button></form>}
                <form action={deleteAddress}><input type="hidden" name="id" value={address.id}/><button type="submit" className="address-delete">Sil</button></form>
              </div>
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
      <form action={signIn}><h2>Giriş Yap</h2><input aria-label="Giriş e-posta" name="email" type="email" placeholder="E-posta" required/><input aria-label="Giriş şifre" name="password" type="password" placeholder="Şifre" minLength={6} required/><button type="submit">Giriş Yap</button></form>
      <form action={signUp}><h2>Hesap Oluştur</h2><input aria-label="Kayıt ad soyad" name="full_name" placeholder="Ad Soyad" required/><input aria-label="Kayıt e-posta" name="email" type="email" placeholder="E-posta" required/><input aria-label="Kayıt şifre" name="password" type="password" placeholder="Şifre (en az 6 karakter)" minLength={6} required/><button type="submit">Kayıt Ol</button></form>
    </div>
  </main><StoreFooter/></>;
}
