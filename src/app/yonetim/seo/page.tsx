import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { saveSiteSetting } from "../actions";

export default async function SeoAdmin() {
  const {supabase}=await requireAdmin();
  const [{data:seoRow},{data:products},{data:posts},{data:integrations}] = await Promise.all([
    supabase.from("site_settings").select("value,updated_at").eq("key","seo").maybeSingle(),
    supabase.from("products").select("id,slug,name,description,product_images(id,alt_text)").eq("is_active",true),
    supabase.from("blog_posts").select("id,slug,title,seo_title,seo_description,status"),
    supabase.from("integration_settings").select("provider,status,is_enabled"),
  ]);
  const seo=(seoRow?.value||{}) as {siteName?:string;defaultTitle?:string;defaultDescription?:string};
  const missingDescriptions=(products||[]).filter(p=>!p.description).length;
  const missingAlt=(products||[]).filter(p=>!(p.product_images||[]).some((img:any)=>img.alt_text)).length;
  const draftPosts=(posts||[]).filter(p=>p.status!=="published").length;
  return <main className="admin-page">
    <div className="admin-page-head"><div><span>SEO & SİSTEM</span><h1>Arama ve Teknik Sağlık</h1></div><p>Meta ayarları, indeksleme yüzeyleri, içerik eksikleri ve entegrasyon durumları.</p></div>
    <section className="admin-kpis">
      <article><span>Aktif Ürün</span><strong>{products?.length||0}</strong></article>
      <article><span>Eksik Açıklama</span><strong>{missingDescriptions}</strong></article>
      <article><span>Eksik Alt Metin</span><strong>{missingAlt}</strong></article>
      <article><span>Blog Taslak</span><strong>{draftPosts}</strong></article>
    </section>
    <section className="admin-dashboard-grid">
      <div className="admin-section">
        <div className="admin-section-head"><h2>Varsayılan SEO</h2><span>{seoRow?.updated_at?new Date(seoRow.updated_at).toLocaleString("tr-TR"):"—"}</span></div>
        <form action={saveSiteSetting} className="admin-editor">
          <input type="hidden" name="key" value="seo"/>
          <label>Site adı<input name="seo_site_name" value={seo.siteName||"Elmas Triko"} readOnly/></label>
          <label>Varsayılan başlık<input name="seo_title_preview" value={seo.defaultTitle||""} readOnly/></label>
          <label>Varsayılan açıklama<textarea name="seo_desc_preview" value={seo.defaultDescription||""} readOnly/></label>
          <input type="hidden" name="value" value={JSON.stringify(seo,null,2)}/>
          <p className="admin-helper">Detaylı JSON düzenleme için Site Ayarları ekranını kullanın.</p>
          <Link className="admin-link-button" href="/yonetim/ayarlar">Site Ayarlarına Git →</Link>
        </form>
      </div>
      <div className="admin-section">
        <div className="admin-section-head"><h2>Teknik Yüzeyler</h2></div>
        <div className="system-check-list">
          <a href="/sitemap.xml" target="_blank"><span>Sitemap</span><b>Aktif</b></a>
          <a href="/robots.txt" target="_blank"><span>Robots.txt</span><b>Aktif</b></a>
          <div><span>Schema.org Organization</span><b>Aktif</b></div>
          <div><span>Security Headers</span><b>Aktif</b></div>
          <div><span>AVIF / WebP</span><b>Aktif</b></div>
          <div><span>Compression</span><b>Aktif</b></div>
        </div>
      </div>
    </section>
    <section className="admin-section"><div className="admin-section-head"><h2>Entegrasyon Durumu</h2><Link href="/yonetim/entegrasyonlar">Yönet →</Link></div>
      <div className="dashboard-integrations">{integrations?.map(i=><div key={i.provider}><span>{i.provider}</span><b className={i.is_enabled?"ok":"wait"}>{i.status}</b></div>)}</div>
    </section>
  </main>;
}
