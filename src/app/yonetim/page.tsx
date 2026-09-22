import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const [products, orders, users, posts, messages, subscribers, recent, integrations, revenueRows, stockRows] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status","new"),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active",true),
    supabase.from("orders").select("id,order_no,status,payment_status,grand_total,currency,created_at,guest_email").order("created_at",{ascending:false}).limit(8),
    supabase.from("integration_settings").select("provider,status,is_enabled,last_checked_at").order("provider"),
    supabase.from("orders").select("grand_total,status,payment_status").eq("payment_status","paid"),
    supabase.from("inventory").select("stock,reserved,product_variants(id,sku,product_id,products(id,name,slug))").lte("stock",5).order("stock").limit(20),
  ]);

  const revenue=(revenueRows.data||[])
    .filter(o=>!["cancelled","refunded"].includes(o.status))
    .reduce((sum,o)=>sum+Number(o.grand_total||0),0);
  const lowStock=(stockRows.data||[]).filter(row=>Number(row.stock)-Number(row.reserved)<=5);

  const cards = [
    ["Ürün",products.count||0],
    ["Sipariş",orders.count||0],
    ["Kullanıcı",users.count||0],
    ["Ödenen Ciro",revenue.toLocaleString("tr-TR")+" TL"],
    ["Yeni Mesaj",messages.count||0],
    ["Düşük Stok",lowStock.length],
    ["Blog Yazısı",posts.count||0],
    ["Bülten",subscribers.count||0],
  ];

  return <main className="admin-page">
    <div className="admin-page-head"><div><span>BUGÜN</span><h1>Genel Bakış</h1></div><p>Mağaza, içerik, müşteri, sipariş, stok ve entegrasyon operasyonunun merkezi görünümü.</p></div>
    <section className="admin-kpis">{cards.map(([label,value])=><article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section>

    <section className="admin-dashboard-grid">
      <div className="admin-section">
        <div className="admin-section-head"><h2>Son Siparişler</h2><Link href="/yonetim/siparisler">Tümünü gör →</Link></div>
        <div className="admin-table">{recent.data?.length ? recent.data.map(o=><Link href={"/yonetim/siparisler/"+o.id} className="admin-row admin-row-link" key={o.id}><b>{o.order_no}</b><span>{o.guest_email||"Üye kullanıcı"}</span><span>{o.status}</span><span>{o.payment_status}</span><strong>{Number(o.grand_total).toLocaleString("tr-TR")} {o.currency}</strong></Link>) : <div className="admin-empty">Henüz sipariş yok.</div>}</div>
      </div>

      <div className="admin-section">
        <div className="admin-section-head"><h2>Entegrasyonlar</h2><Link href="/yonetim/entegrasyonlar">Yönet →</Link></div>
        <div className="dashboard-integrations">{integrations.data?.map(i=><div key={i.provider}><span>{i.provider}</span><b className={i.is_enabled?"ok":"wait"}>{i.status}</b></div>)}</div>
        <div className="admin-section-head admin-subhead"><h2>Düşük Stok</h2><Link href="/yonetim/urunler">Ürünlere git →</Link></div>
        <div className="stock-alert-list">{lowStock.length?lowStock.map((row:any)=>{const variant=Array.isArray(row.product_variants)?row.product_variants[0]:row.product_variants;const product=variant&&(Array.isArray(variant.products)?variant.products[0]:variant.products);return <div key={variant?.id||Math.random()}><span>{product?.name||variant?.sku||"Varyant"}</span><b>{Math.max(0,Number(row.stock)-Number(row.reserved))} adet</b></div>}):<div className="admin-empty">Düşük stok kaydı yok.</div>}</div>
      </div>
    </section>
  </main>;
}
