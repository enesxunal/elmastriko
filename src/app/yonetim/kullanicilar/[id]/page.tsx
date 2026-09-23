import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export default async function AdminUserDetail({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {supabase}=await requireAdmin();
  const [{data:user},{data:addresses},{data:orders},{data:favorites}] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,phone,role,created_at,updated_at").eq("id",id).maybeSingle(),
    supabase.from("addresses").select("id,title,full_name,phone,city,district,address_line,is_default,created_at").eq("user_id",id).order("is_default",{ascending:false}),
    supabase.from("orders").select("id,order_no,status,payment_status,grand_total,currency,created_at").eq("user_id",id).order("created_at",{ascending:false}).limit(50),
    supabase.from("favorites").select("product_id,products(id,name,slug)").eq("user_id",id).limit(100),
  ]);
  if(!user) notFound();
  const lifetime=(orders||[]).filter(o=>!["cancelled","refunded"].includes(o.status)).reduce((s,o)=>s+Number(o.grand_total||0),0);
  return <main className="admin-page">
    <div className="admin-breadcrumb"><Link href="/yonetim/kullanicilar">← Kullanıcılar</Link></div>
    <div className="admin-page-head"><div><span>MÜŞTERİ DETAYI</span><h1>{user.full_name||"İsimsiz kullanıcı"}</h1></div><p>{user.email||"E-posta yok"} · {user.phone||"Telefon yok"}</p></div>
    <section className="admin-order-summary">
      <article><span>Rol</span><strong>{user.role}</strong></article>
      <article><span>Sipariş</span><strong>{orders?.length||0}</strong></article>
      <article><span>Toplam Harcama</span><strong>{lifetime.toLocaleString("tr-TR")} TL</strong></article>
      <article><span>Favori</span><strong>{favorites?.length||0}</strong></article>
    </section>
    <section className="admin-dashboard-grid">
      <div className="admin-section"><div className="admin-section-head"><h2>Sipariş Geçmişi</h2></div>
        <div className="admin-table">{orders?.length?orders.map(o=><Link href={"/yonetim/siparisler/"+o.id} className="admin-row admin-row-link" key={o.id}><b>{o.order_no}</b><span>{o.status}</span><span>{o.payment_status}</span><strong>{Number(o.grand_total).toLocaleString("tr-TR")} {o.currency}</strong></Link>):<div className="admin-empty">Sipariş yok.</div>}</div>
      </div>
      <div className="admin-section"><div className="admin-section-head"><h2>Adresler</h2></div>
        <div className="address-list admin-user-addresses">{addresses?.length?addresses.map(a=><article className="address-card" key={a.id}><div><span>{a.is_default?"VARSAYILAN":"ADRES"}</span><h3>{a.title}</h3></div><p><b>{a.full_name}</b><br/>{a.address_line}<br/>{a.district} / {a.city}{a.phone?<><br/>{a.phone}</>:null}</p></article>):<div className="admin-empty">Adres yok.</div>}</div>
      </div>
    </section>
    <section className="admin-section"><div className="admin-section-head"><h2>Favoriler</h2><span>{favorites?.length||0}</span></div>
      <div className="admin-category-row">{favorites?.map((f:{products:{id:string;name:string;slug:string}|{id:string;name:string;slug:string}[]|null})=>{const p=Array.isArray(f.products)?f.products[0]:f.products;return p?<Link key={p.id} href={"/urun/"+p.slug}>{p.name}</Link>:null})}</div>
    </section>
  </main>;
}
