import { orderLabels, paymentLabels } from "@/lib/admin-order-labels";
import { basitKargo } from "@/lib/integrations/basitkargo";
import { invoiceIntegration, isNesConfigured } from "@/lib/integrations/invoice";
import { isToslaConfigured } from "@/lib/integrations/tosla";
import Link from "next/link";
import { ArrowUpRight, Boxes, CircleDollarSign, Mail, PackageSearch, ShoppingCart, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const [products, orders, users, posts, messages, subscribers, recent, revenueRows, stockRows] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status","new"),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active",true),
    supabase.from("orders").select("id,order_no,status,payment_status,grand_total,currency,created_at,guest_email").order("created_at",{ascending:false}).limit(8),
    supabase.from("orders").select("grand_total,status,payment_status").eq("payment_status","paid"),
    supabase.from("inventory").select("stock,reserved,product_variants(id,sku,product_id,products(id,name,slug))").lte("stock",5).order("stock").limit(20),
  ]);

  // Derive health from the same services as the integration detail page, not stale manual flags.
  const [couriers, nesHealth] = await Promise.all([
    basitKargo.listHandlers().then(handlers => ({ok:true,handlers}), () => ({ok:false,handlers:[] as {code?:string;name?:string}[]})),
    isNesConfigured() ? invoiceIntegration.healthCheck().then(() => true, () => false) : Promise.resolve(false),
  ]);
  const suratReady = couriers.ok && couriers.handlers.some(item => String(item.code || "").toUpperCase().includes("SURAT") || String(item.name || "").toLocaleUpperCase("tr-TR").includes("SÜRAT"));
  const paymentConfigured = isToslaConfigured();
  const paymentLive = (process.env.TOSLA_MODE || "test").toLowerCase() === "live";
  const integrationHealth = [
    {name:"Sürat Kargo / BasitKargo", status:suratReady?"Bağlantı doğrulandı": "Kontrol gerekli", ok:suratReady},
    {name:"NES e-Fatura", status:nesHealth?"Bağlantı doğrulandı":"Kontrol gerekli", ok:nesHealth},
    {name:"Ödeme / Tosla", status:paymentConfigured && paymentLive?"Canlı ayarları tanımlı (işlem testi gerekli)":paymentConfigured?"Test modu / kontrol gerekli":"Yapılandırma gerekli", ok:paymentConfigured && paymentLive},
  ];
  const revenue=(revenueRows.data||[])
    .filter(o=>!["cancelled","refunded"].includes(o.status))
    .reduce((sum,o)=>sum+Number(o.grand_total||0),0);
  const lowStock=(stockRows.data||[]).filter(row=>Number(row.stock)-Number(row.reserved)<=5);

  const primary = [
    {label:"Toplam Ciro", value: revenue.toLocaleString("tr-TR")+" TL", note:"Ödemesi tamamlanan siparişler", icon:CircleDollarSign},
    {label:"Siparişler", value:orders.count||0, note:"Toplam sipariş", icon:ShoppingCart},
    {label:"Ürünler", value:products.count||0, note:"Katalogdaki ürün", icon:Boxes},
    {label:"Müşteriler", value:users.count||0, note:"Kayıtlı hesap", icon:Users},
  ];
  const secondary = [
    ["Yeni mesaj",messages.count||0],
    ["Düşük stok",lowStock.length],
    ["Blog yazısı",posts.count||0],
    ["Bülten abonesi",subscribers.count||0],
  ];

  return <main className="admin-page">
    <section className="admin-hero">
      <div><span>GENEL BAKIŞ</span><h1>Mağaza bugün nasıl?</h1><p>Sipariş, müşteri, stok ve içerik operasyonlarını tek ekrandan takip edin.</p></div>
      <div className="admin-hero-actions">
        <Link href="/yonetim/urunler">Ürün ekle <ArrowUpRight size={15}/></Link>
        <Link href="/yonetim/siparisler" className="secondary">Siparişleri gör</Link>
      </div>
    </section>

    <section className="admin-primary-kpis">
      {primary.map(({label,value,note,icon:Icon})=><article key={label}>
        <div className="kpi-icon"><Icon size={18}/></div>
        <span>{label}</span><strong>{value}</strong><small>{note}</small>
      </article>)}
    </section>

    <section className="admin-mini-kpis">
      {secondary.map(([label,value])=><div key={String(label)}><span>{label}</span><b>{value}</b></div>)}
    </section>

    <section className="admin-dashboard-grid">
      <div className="admin-section admin-orders-panel">
        <div className="admin-section-head"><div><span>OPERASYON</span><h2>Son Siparişler</h2></div><Link href="/yonetim/siparisler">Tüm siparişler <ArrowUpRight size={14}/></Link></div>
        <div className="admin-table">{recent.data?.length ? recent.data.map(o=><Link href={"/yonetim/siparisler/"+o.id} className="admin-row admin-row-link" key={o.id}><b>{o.order_no}</b><span>{o.guest_email||"Üye kullanıcı"}</span><span className="admin-pill">{orderLabels[o.status] || "Kontrol gerekli"}</span><span className="admin-pill muted">{paymentLabels[o.payment_status] || "Kontrol gerekli"}</span><strong>{Number(o.grand_total).toLocaleString("tr-TR")} {o.currency}</strong></Link>) : <div className="admin-empty-state"><ShoppingCart size={24}/><b>Henüz sipariş yok</b><span>Yeni siparişler burada görünecek.</span></div>}</div>
      </div>

      <div className="admin-side-stack">
        <div className="admin-section">
          <div className="admin-section-head"><div><span>SİSTEM</span><h2>Entegrasyonlar</h2></div><Link href="/yonetim/entegrasyonlar">Yönet</Link></div>
          <div className="dashboard-integrations">{integrationHealth.map(i=><div key={i.name}><span>{i.name}</span><b className={i.ok?"ok":"wait"}>{i.status}</b></div>)}</div>
        </div>

        <div className="admin-section">
          <div className="admin-section-head"><div><span>STOK</span><h2>Düşük Stok</h2></div><Link href="/yonetim/urunler">Ürünler</Link></div>
          <div className="stock-alert-list">{lowStock.length?lowStock.slice(0,6).map((row:{stock:number;reserved:number;product_variants:{id:string;sku:string|null;products:{id:string;name:string;slug:string}|{id:string;name:string;slug:string}[]|null}|{id:string;sku:string|null;products:{id:string;name:string;slug:string}|{id:string;name:string;slug:string}[]|null}[]|null})=>{const variant=Array.isArray(row.product_variants)?row.product_variants[0]:row.product_variants;const product=variant&&(Array.isArray(variant.products)?variant.products[0]:variant.products);return <div key={variant?.id||variant?.sku}><span>{product?.name||variant?.sku||"Varyant"}</span><b>{Math.max(0,Number(row.stock)-Number(row.reserved))} adet</b></div>}):<div className="admin-empty-state compact"><PackageSearch size={20}/><span>Düşük stok yok.</span></div>}</div>
        </div>

        <Link href="/yonetim/mesajlar" className="admin-inbox-card"><div><Mail size={18}/><span>Mesaj Kutusu</span></div><b>{messages.count||0}</b></Link>
      </div>
    </section>
  </main>;
}
