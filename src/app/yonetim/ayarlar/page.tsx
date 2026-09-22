import { requireAdmin } from "@/lib/admin";
import { saveContactSettings, saveSeoSettings, saveSiteSetting } from "../actions";

type SeoSetting={siteName?:string;defaultTitle?:string;defaultDescription?:string};
type ContactSetting={email?:string;phone?:string;whatsapp?:string;instagram?:string};

export default async function SettingsAdmin({searchParams}:{searchParams:Promise<{error?:string}>}){
  const {error}=await searchParams;
  const {supabase}=await requireAdmin();
  const {data:settings}=await supabase.from("site_settings").select("key,value,updated_at").order("key");
  const find=(key:string)=>settings?.find(x=>x.key===key)?.value as Record<string,unknown>|undefined;
  const seo=(find("seo")||{}) as SeoSetting;
  const contact=(find("contact")||{}) as ContactSetting;
  const advanced=settings?.filter(x=>!["seo","contact"].includes(x.key))||[];

  return <main className="admin-page">
    <div className="admin-page-head"><div><span>YAPILANDIRMA</span><h1>Site & SEO Ayarları</h1></div><p>Müşterinin günlük kullanacağı temel site ayarları. Teknik JSON alanları ayrıca gelişmiş bölümde tutulur.</p></div>
    {error&&<div className="admin-alert error">{error}</div>}

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

    <section className="admin-section">
      <div className="admin-section-head"><h2>Gelişmiş Ayarlar</h2><span>Teknik kullanım</span></div>
      <div className="settings-grid">{advanced.map(s=><form action={saveSiteSetting} key={s.key}><h2>{s.key}</h2><input type="hidden" name="key" value={s.key}/><textarea name="value" defaultValue={JSON.stringify(s.value,null,2)}/><button>Kaydet</button></form>)}</div>
    </section>
  </main>;
}
