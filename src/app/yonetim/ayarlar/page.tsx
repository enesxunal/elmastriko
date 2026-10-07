import { requireAdmin } from "@/lib/admin";
import { saveContactSettings, saveMailSettings, saveProductOptions, saveSeoSettings, saveSiteSetting, testMailSettings } from "../actions";

type SeoSetting={siteName?:string;defaultTitle?:string;defaultDescription?:string};
type ContactSetting={email?:string;phone?:string;whatsapp?:string;instagram?:string};
type ProductOptionsSetting={colors?:string[];sizes?:string[]};
type MailSetting={
  account_key:"sales"|"support";
  email:string;
  smtp_host:string;
  smtp_port:number;
  smtp_secure:boolean;
  smtp_user:string;
  smtp_password_encrypted:string;
  imap_host:string;
  imap_port:number;
  is_enabled:boolean;
  last_tested_at:string|null;
  last_test_status:string|null;
};

function MailAccountForm({row,accountKey,label,description}:{row?:MailSetting;accountKey:"sales"|"support";label:string;description:string}) {
  const defaultEmail=accountKey==="sales"?"satis@elmastriko.com":"destek@elmastriko.com";
  const hasPassword=Boolean(row?.smtp_password_encrypted);
  return <article className="mail-settings-card">
    <div className="mail-settings-card-head">
      <div><span>{accountKey==="sales"?"SİPARİŞ BİLDİRİMLERİ":"MÜŞTERİ E-POSTALARI"}</span><h3>{label}</h3><p>{description}</p></div>
      <b className={row?.last_test_status==="ok"?"active":"waiting"}>{row?.last_test_status==="ok"?"Bağlantı doğrulandı":hasPassword?"Test bekliyor":"Şifre bekleniyor"}</b>
    </div>
    <form action={saveMailSettings} className="mail-settings-form">
      <input type="hidden" name="account_key" value={accountKey}/>
      <label>E-posta adresi<input name="email" type="email" required defaultValue={row?.email||defaultEmail}/></label>
      <label>Kullanıcı adı<input name="smtp_user" type="email" required defaultValue={row?.smtp_user||defaultEmail}/></label>
      <label>Şifre<input name="smtp_password" type="password" autoComplete="new-password" placeholder={hasPassword?"Kayıtlı şifreyi değiştirmek için yazın":"Mail hesabı şifresi"} required={!hasPassword}/><small>{hasPassword?"Şifre güvenli olarak kayıtlı. Boş bırakırsanız değişmez.":"Şifre tarayıcıya geri gösterilmez."}</small></label>
      <label>SMTP sunucusu<input name="smtp_host" required defaultValue={row?.smtp_host||"mail.webaltyapi.com"}/></label>
      <label>SMTP portu<input name="smtp_port" type="number" required defaultValue={row?.smtp_port||587}/></label>
      <label>SMTP güvenliği<select name="smtp_security" defaultValue={row?.smtp_secure?"ssl":"starttls"}><option value="starttls">STARTTLS</option><option value="ssl">SSL/TLS</option></select></label>
      <label>IMAP sunucusu<input name="imap_host" required defaultValue={row?.imap_host||"mail.webaltyapi.com"}/></label>
      <label>IMAP portu<input name="imap_port" type="number" required defaultValue={row?.imap_port||993}/></label>
      <label className="mail-toggle"><input name="is_enabled" type="checkbox" defaultChecked={row?.is_enabled!==false}/><span>Bu hesabı aktif kullan</span></label>
      <button className="admin-primary-button" type="submit">Mail Ayarlarını Kaydet</button>
    </form>
    <form action={testMailSettings} className="mail-test-form">
      <input type="hidden" name="account_key" value={accountKey}/>
      <button className="admin-secondary-button" type="submit" disabled={!hasPassword}>SMTP Bağlantısını Test Et</button>
      <small>{row?.last_tested_at ? "Son test: " + new Date(row.last_tested_at).toLocaleString("tr-TR") : "Henüz bağlantı testi yapılmadı."}</small>
    </form>
  </article>;
}

export default async function SettingsAdmin({searchParams}:{searchParams:Promise<{error?:string;mail_error?:string;mail_saved?:string;mail_test?:string}>}){
  const params=await searchParams;
  const {supabase}=await requireAdmin();
  const {data:settings} = await supabase.from("site_settings").select("key,value,updated_at").order("key");
  const find=(key:string)=>settings?.find(x=>x.key===key)?.value as Record<string,unknown>|undefined;
  const seo=(find("seo")||{}) as SeoSetting;
  const contact=(find("contact")||{}) as ContactSetting;
  const productOptions=(find("product_options")||{}) as ProductOptionsSetting;
  const defaultColors=["Siyah","Beyaz","Ekru","Lacivert","Bordo","Yeşil","Haki","Gri","Vizon","Bej","Mürdüm"];
  const defaultSizes=["S","M","L","XL","XXL"];
  const colors=Array.isArray(productOptions.colors)&&productOptions.colors.length?productOptions.colors:defaultColors;
  const sizes=Array.isArray(productOptions.sizes)&&productOptions.sizes.length?productOptions.sizes:defaultSizes;
  const advanced=settings?.filter(x=>!["seo","contact","product_options","mail_sales","mail_support"].includes(x.key))||[];
  const sales=(find("mail_sales")||undefined) as MailSetting|undefined;
  const support=(find("mail_support")||undefined) as MailSetting|undefined;

  return <main className="admin-page">
    <div className="admin-page-head"><div><span>YAPILANDIRMA</span><h1>Site & SEO Ayarları</h1></div><p>Müşterinin günlük kullanacağı temel site ayarları. Teknik JSON alanları ayrıca gelişmiş bölümde tutulur.</p></div>
    {params.error&&<div className="admin-alert error">{params.error}</div>}
    {params.mail_error&&<div className="admin-alert error">{params.mail_error}</div>}
    {params.mail_saved&&<div className="admin-alert">Mail hesabı kaydedildi.</div>}
    {params.mail_test&&<div className="admin-alert">SMTP bağlantısı başarıyla doğrulandı.</div>}

    <section className="admin-section mail-settings-section">
      <div className="admin-section-head"><div><h2>Mail Bağlantıları</h2><span>WebAltyapı mail sunucusu</span></div><small>Gelen: mail.webaltyapi.com:993 SSL/TLS · Giden: mail.webaltyapi.com:587 STARTTLS</small></div>
      <div className="mail-settings-grid">
        <MailAccountForm row={sales} accountKey="sales" label="satis@elmastriko.com" description="Yeni sipariş geldiğinde mağaza bildirimi bu hesaba gelir."/>
        <MailAccountForm row={support} accountKey="support" label="destek@elmastriko.com" description="Kayıt, sipariş durumu, ödeme ve kargo hareketleri müşteriye bu hesaptan gönderilir."/>
      </div>
    </section>

    <section className="settings-grid friendly-settings">
      <form action={saveSeoSettings}>
        <h2>SEO</h2>
        <label>Site adı<input name="site_name" defaultValue={seo.siteName||"Elmas Triko"}/></label>
        <label>Varsayılan SEO başlığı<input name="default_title" defaultValue={seo.defaultTitle||"Elmas Triko | Kadın & Erkek Triko"} maxLength={70}/></label>
        <label>Meta açıklama<textarea name="default_description" defaultValue={seo.defaultDescription||""} maxLength={180}/></label>
        <p>Ürün ve blog sayfaları kendi başlık/açıklamalarını otomatik üretir. Bu alan site geneli için varsayılandır.</p>
        <button>SEO Ayarlarını Kaydet</button>
      </form>

      <form action={saveContactSettings}>
        <h2>İletişim & Sosyal</h2>
        <label>E-posta<input name="email" type="email" defaultValue={contact.email||""} placeholder="info@elmastriko.com"/></label>
        <label>Telefon<input name="phone" defaultValue={contact.phone||""} placeholder="+90..."/></label>
        <label>WhatsApp<input name="whatsapp" defaultValue={contact.whatsapp||""} placeholder="+90..."/></label>
        <label>Instagram<input name="instagram" defaultValue={contact.instagram||""} placeholder="https://instagram.com/elmas_triko"/></label>
        <button>İletişim Bilgilerini Kaydet</button>
      </form>
    </section>

    <section className="admin-section" id="product-options">
      <div className="admin-section-head"><h2>Ürün seçenekleri</h2><span>Varyantlarda tekrar kullanılır</span></div>
      <form action={saveProductOptions} className="product-options-settings">
        <div><label>Renkler</label><textarea name="colors" defaultValue={colors.join("\n")} rows={8}/><small>Her satıra bir renk yazın. Ürün varyantlarında sabit listeden seçilir.</small></div>
        <div><label>Bedenler</label><textarea name="sizes" defaultValue={sizes.join("\n")} rows={8}/><small>Örn: S, M, L, XL, XXL. Gerektiğinde yeni beden ekleyebilirsiniz.</small></div>
        <button className="admin-primary-button" type="submit">Ürün seçeneklerini kaydet</button>
      </form>
    </section>

    <section className="admin-section">
      <div className="admin-section-head"><h2>Gelişmiş Ayarlar</h2><span>Teknik kullanım</span></div>
      <div className="settings-grid">{advanced.map(s=><form action={saveSiteSetting} key={s.key}><h2>{s.key}</h2><input type="hidden" name="key" value={s.key}/><textarea name="value" defaultValue={JSON.stringify(s.value,null,2)}/><button>Kaydet</button></form>)}</div>
    </section>
  </main>;
}
