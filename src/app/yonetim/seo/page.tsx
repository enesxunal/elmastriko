import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { saveSeoSettings } from "../actions";

export default async function SeoAdmin({searchParams}:{searchParams:Promise<{error?:string;saved?:string}>}) {
  const {error,saved}=await searchParams;
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
  const missingBlogSeo=(posts||[]).filter(p=>p.status==="published"&&(!p.seo_title||!p.seo_description)).length;

  return <main className="admin-page">
    <div className="admin-page-head"><div><span>SEO & SİSTEM</span><h1>Arama ve Teknik Sağlık</h1></div><p>Google görünürlüğü, meta alanları, ürün verileri ve teknik indeksleme kontrolleri.</p></div>
    {error&&<div className="admin-alert error">{error}</div>}
    {saved&&<div className="admin-alert success">SEO ayarları kaydedildi.</div>}

    <section className="admin-kpis">
      <article><span>Aktif Ürün</span><strong>{products?.length||0}</strong></article>
      <article><span>Eksik Ürün Açıklaması</span><strong>{missingDescriptions}</strong></article>
      <article><span>Eksik Görsel Alt Metni</span><strong>{missingAlt}</strong></article>
      <article><span>Blog SEO Eksiği</span><strong>{missingBlogSeo}</strong></article>
    </section>

    <section className="admin-dashboard-grid">
      <div className="admin-section">
        <div className="admin-section-head"><h2>Varsayılan SEO</h2><span>{seoRow?.updated_at?new Date(seoRow.updated_at).toLocaleString("tr-TR"):"—"}</span></div>
        <form action={saveSeoSettings} className="admin-editor">
          <label>Site adı<input name="site_name" defaultValue={seo.siteName||"Elmas Triko"} required/></label>
          <label>Varsayılan başlık<input name="default_title" defaultValue={seo.defaultTitle||"Elmas Triko | Kadın & Erkek Triko"} maxLength={65} required/><small>Arama sonuçlarında yaklaşık 50–60 karakter hedefleyin.</small></label>
          <label>Varsayılan açıklama<textarea name="default_description" defaultValue={seo.defaultDescription||"Elmas Triko kadın ve erkek koleksiyonları. Yeni sezon triko, hırka, kazak ve zamansız parçalar."} maxLength={170} required/><small>Ürün ve blog sayfaları kendi açıklamalarını kullanır.</small></label>
          <button className="admin-primary-button" type="submit">SEO ayarlarını kaydet</button>
        </form>
      </div>

      <div className="admin-section">
        <div className="admin-section-head"><h2>Teknik Yüzeyler</h2></div>
        <div className="system-check-list">
          <a href="/sitemap.xml" target="_blank"><span>Sitemap</span><b>Aktif</b></a>
          <a href="/robots.txt" target="_blank"><span>Robots.txt</span><b>Aktif</b></a>
          <div><span>Canonical URL</span><b>Aktif</b></div>
          <div><span>Organization Schema</span><b>Aktif</b></div>
          <div><span>Product + Offer Schema</span><b>Aktif</b></div>
          <div><span>Breadcrumb Schema</span><b>Aktif</b></div>
          <div><span>Open Graph / X Cards</span><b>Aktif</b></div>
          <div><span>Admin noindex</span><b>Aktif</b></div>
          <div><span>Security Headers + CSP gözlem</span><b>Aktif</b></div>
          <div><span>AVIF / WebP + Compression</span><b>Aktif</b></div>
        </div>
      </div>
    </section>

    <section className="admin-dashboard-grid">
      <div className="admin-section">
        <div className="admin-section-head"><h2>İçerik Kontrolü</h2><Link href="/yonetim/urunler">Ürünlere Git →</Link></div>
        <div className="system-check-list">
          <div><span>Eksik ürün açıklaması</span><b>{missingDescriptions}</b></div>
          <div><span>Eksik görsel alt metni</span><b>{missingAlt}</b></div>
          <div><span>Blog taslakları</span><b>{draftPosts}</b></div>
          <div><span>Yayında olup SEO alanı eksik blog</span><b>{missingBlogSeo}</b></div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-head"><h2>Entegrasyon Durumu</h2><Link href="/yonetim/entegrasyonlar">Yönet →</Link></div>
        <div className="dashboard-integrations">{integrations?.map(i=><div key={i.provider}><span>{i.provider}</span><b className={i.is_enabled?"ok":"wait"}>{i.status}</b></div>)}</div>
      </div>
    </section>
  </main>;
}
