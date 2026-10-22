import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import AccountShell from "@/components/AccountShell";
import { createClient } from "@/lib/supabase/server";
import { addAddress, deleteAddress, setDefaultAddress, updateAddress } from "@/app/auth/actions";

export default async function AccountAddressesPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hesabim");

  const [{ data: profile }, { data: addresses }, { data: latestOrder }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase.from("addresses").select("id, title, full_name, phone, city, district, postal_code, address_line, is_default").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("orders").select("id,guest_phone").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  // Only prefill from an order tied to this authenticated user; guest orders never merge by email.
  const { data: recentDelivery } = (!addresses?.length && latestOrder?.id)
    ? await supabase.from("order_addresses").select("full_name,phone,city,district,postal_code,address_line").eq("order_id", latestOrder.id).eq("kind", "shipping").maybeSingle()
    : { data: null };

  return <><StoreHeader/><AccountShell name={profile?.full_name || user.email || "Hesabım"} email={user.email || ""} current="/hesabim/adresler">
    <div className="account-section-head"><span>ADRESLER</span><h1>Teslimat adreslerim</h1><p>Kayıtlı adreslerinizi düzenleyin veya yeni adres ekleyin.</p></div>
    {(params.error || params.message) && <div className={"auth-message " + (params.error ? "error" : "")}>{params.error || params.message}</div>}
    <section className="address-section account-address-page">
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
                  <input type="hidden" name="return_to" value="/hesabim/adresler"/>
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
              {!address.is_default && <form action={setDefaultAddress}><input type="hidden" name="id" value={address.id}/><input type="hidden" name="return_to" value="/hesabim/adresler"/><button type="submit">Varsayılan Yap</button></form>}
              <form action={deleteAddress}><input type="hidden" name="id" value={address.id}/><input type="hidden" name="return_to" value="/hesabim/adresler"/><button type="submit" className="address-delete">Sil</button></form>
            </div>
          </article>) : <div className="address-empty">Kayıtlı adresiniz bulunmuyor.</div>}
        </div>

        <form className="address-form" action={addAddress}>
          <input type="hidden" name="return_to" value="/hesabim/adresler"/>
          <h3>Yeni adres ekle</h3>
          {recentDelivery && <p className="account-order-address-note">Son siparişinizdeki adres bilgilerini hazır doldurduk. Kalıcı olarak kaydetmek için “Adresi Kaydet” butonuna basın.</p>}
          <div className="form-grid">
            <input name="title" defaultValue={recentDelivery ? "Son sipariş adresim" : ""} placeholder="Adres başlığı" required/>
            <input name="full_name" defaultValue={recentDelivery?.full_name || profile?.full_name || ""} placeholder="Ad Soyad" required/>
            <input name="phone" defaultValue={recentDelivery?.phone || profile?.phone || latestOrder?.guest_phone || ""} placeholder="Telefon"/>
            <input name="city" defaultValue={recentDelivery?.city || ""} placeholder="İl" required/>
            <input name="district" defaultValue={recentDelivery?.district || ""} placeholder="İlçe" required/>
            <input name="postal_code" defaultValue={recentDelivery?.postal_code || ""} placeholder="Posta kodu"/>
            <input className="full" name="address_line" defaultValue={recentDelivery?.address_line || ""} placeholder="Açık adres" required/>
          </div>
          <label className="check-row"><input type="checkbox" name="is_default"/> Varsayılan adres yap</label>
          <button type="submit">Adresi Kaydet</button>
        </form>
      </div>
    </section>
  </AccountShell><StoreFooter/></>;
}
