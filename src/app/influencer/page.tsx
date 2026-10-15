import type { Metadata } from "next";
import Link from "next/link";
import { requireInfluencer,money } from "@/lib/influencer";
import { requestInfluencerPayout } from "./actions";
import "./influencer.css";
export const metadata: Metadata={title:"Influencer Kazanç Paneli",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
type Attribution={order_id:string;code:string;discount_amount:number;commission_amount:number;created_at:string;orders:{order_no:string;subtotal:number;status:string;payment_status:string;delivered_at:string|null}|{order_no:string;subtotal:number;status:string;payment_status:string;delivered_at:string|null}[]|null};
type Payout={id:string;amount:number;status:string;requested_at:string;decided_at:string|null};
export default async function InfluencerHome({searchParams}:{searchParams:Promise<{message?:string;error?:string;days?:string}>}){
  const { influencer,admin }=await requireInfluencer();
  const params=await searchParams;
  const days=[7,30,90].includes(Number(params.days))?Number(params.days):30;
  const [rows,clicks,payouts]=await Promise.all([
    admin.from("influencer_orders").select("order_id,code,discount_amount,commission_amount,created_at,orders(order_no,subtotal,status,payment_status,delivered_at)").eq("influencer_id",influencer.id).order("created_at",{ascending:false}).limit(500),
    admin.from("influencer_clicks").select("visit_day").eq("influencer_id",influencer.id).gte("visit_day",new Date(Date.now()-days*86400000).toISOString().slice(0,10)).limit(20000),
    admin.from("influencer_payout_requests").select("id,amount,status,requested_at,decided_at").eq("influencer_id",influencer.id).order("requested_at",{ascending:false}).limit(100),
  ]);
  const orders=(rows.data||[]) as Attribution[];
  const requests=(payouts.data||[]) as Payout[];
  const cutoff=Date.now()-14*86400000;
  const state=(a:Attribution)=>{const order=Array.isArray(a.orders)?a.orders[0]:a.orders;
    if(!order||["cancelled","refunded"].includes(order.status)||["refunded","cancelled"].includes(order.payment_status))return "İptal / İade";
    if(order.payment_status!=="paid")return "Ödeme bekliyor";
    if(order.status!=="delivered"||!order.delivered_at||new Date(order.delivered_at).getTime()>cutoff)return "Bekleyen kazanç";
    return "Kesinleşti";
  };
  const eligible=orders.filter(o=>state(o)==="Kesinleşti").reduce((s,o)=>s+Number(o.commission_amount),0);
  const reserved=requests.filter(r=>["pending","paid"].includes(r.status)).reduce((s,r)=>s+Number(r.amount),0);
  const available=Math.max(0,Math.round((eligible-reserved)*100)/100);
  const pending=orders.filter(o=>state(o)==="Bekleyen kazanç").reduce((s,o)=>s+Number(o.commission_amount),0);
  const sales=orders.filter(o=>state(o)!=="İptal / İade" && state(o)!=="Ödeme bekliyor").reduce((s,o)=>{
    const order=Array.isArray(o.orders)?o.orders[0]:o.orders;
    return s+Number(order?.subtotal||0)-Number(o.discount_amount||0);
  },0);
  const counts=new Map<string,number>();
  for(const c of clicks.data||[])counts.set(c.visit_day,(counts.get(c.visit_day)||0)+1);
  const graph=Array.from({length:days},(_,index)=>{const date=new Date(Date.now()-(days-index-1)*86400000).toISOString().slice(0,10);return {date,count:counts.get(date)||0}});
  const max=Math.max(1,...graph.map(g=>g.count));
  return <main className="affiliate-public-shell"><div className="affiliate-dashboard">
    <header className="affiliate-public-header"><Link href="/" className="affiliate-mark">ELMAS TRİKO</Link><Link href="/" className="affiliate-muted">Mağazaya dön →</Link></header>
    <div className="affiliate-welcome"><span>İŞ BİRLİĞİ PANELİ</span><h1>Merhaba, {influencer.full_name}</h1><p>İndirim kodunuzu paylaşın, satış performansınızı ve komisyonlarınızı buradan takip edin.</p></div>
    {params.error&&<p className="affiliate-alert error">{params.error}</p>}{params.message&&<p className="affiliate-alert success">{params.message}</p>}
    <section className="affiliate-stat-grid">
      <article><span>Satış tutarı</span><strong>{money(sales)}</strong><small>Ödemesi onaylanan siparişler</small></article>
      <article><span>Kodlu sipariş</span><strong>{orders.length}</strong><small>İadeler dahil kayıt</small></article>
      <article><span>Bekleyen kazanç</span><strong>{money(pending)}</strong><small>Teslimat ve 14 gün bekleme</small></article>
      <article><span>Çekilebilir kazanç</span><strong>{money(available)}</strong><small>Min. ödeme talebi 1.000 TL</small></article>
    </section>
    <section className="affiliate-grid">
      <article className="affiliate-card"><h2>Paylaşım bilgileriniz</h2><div className="affiliate-code-card"><span>İndirim kodunuz</span><strong>{influencer.code}</strong><small>Takipçilerinize %{influencer.discount_percent} indirim</small></div><label>Özel bağlantınız<input readOnly value={`https://www.elmastriko.com/?ref=${influencer.slug}`}/></label><p className="affiliate-muted">Siparişler kodunuzla eşleşir. Komisyon oranınız %{influencer.commission_percent}.</p></article>
      <article className="affiliate-card"><h2>Ödeme talebi</h2><strong className="affiliate-balance">{money(available)}</strong><p className="affiliate-muted">Ödemesi alınmış, teslim edilmiş ve 14 günlük bekleme süresi dolmuş siparişlerden birikir. İadeler düşülür.</p><form action={requestInfluencerPayout}><button className="affiliate-button" disabled={available<1000||requests.some(r=>r.status==="pending")}>{requests.some(r=>r.status==="pending")?"Talebiniz değerlendiriliyor":available<1000?"En az 1.000 TL gerekli":"Ödeme talebi oluştur"}</button></form><p className="affiliate-muted">Ödeme talebiniz otomatik olarak satış ekibine bildirilir; banka transferi manuel gerçekleştirilir.</p></article>
    </section>
    <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Ziyaret performansı</h2><p className="affiliate-muted">Kişisel bağlantınızdan gelen günlük tekil ziyaretler</p></div><div className="affiliate-periods">{[7,30,90].map(n=><Link key={n} href={`/influencer?days=${n}`} className={days===n?"active":""}>{n} gün</Link>)}</div></div>
      <div className="affiliate-chart" aria-label="Günlük bağlantı ziyaretleri">{graph.map(g=><div key={g.date} title={g.date+" · "+g.count+" ziyaret"}><span style={{height:`${Math.max(3,g.count/max*100)}%`}}/><small>{days===7?g.date.slice(5):g.date.slice(8)}</small></div>)}</div>
      <p className="affiliate-muted">Bu dönemde {clicks.data?.length||0} ziyaret kaydedildi. Analitik veriler yaklaşık olabilir.</p>
    </section>
    <section className="affiliate-card"><h2>Satış ve komisyon geçmişi</h2>{orders.length===0?<p className="affiliate-muted">Henüz kodunuzla oluşturulmuş sipariş bulunmuyor.</p>:<div className="affiliate-table-wrap"><table className="affiliate-table"><thead><tr><th>Sipariş</th><th>Tarih</th><th>Komisyon</th><th>Durum</th></tr></thead><tbody>{orders.map(o=>{
      const order=Array.isArray(o.orders)?o.orders[0]:o.orders;
      return <tr key={o.order_id}><td>{order?.order_no||"Sipariş"}</td><td>{new Date(o.created_at).toLocaleDateString("tr-TR")}</td><td>{money(o.commission_amount)}</td><td>{state(o)}</td></tr>;
    })}</tbody></table></div>}</section>
    <section className="affiliate-card"><h2>Ödeme talepleri</h2>{requests.length===0?<p className="affiliate-muted">Henüz ödeme talebiniz yok.</p>:<div className="affiliate-table-wrap"><table className="affiliate-table"><thead><tr><th>Tarih</th><th>Tutar</th><th>Durum</th></tr></thead><tbody>{requests.map(r=><tr key={r.id}><td>{new Date(r.requested_at).toLocaleDateString("tr-TR")}</td><td>{money(r.amount)}</td><td>{r.status==="pending"?"Onay bekliyor":r.status==="paid"?"Ödendi":"Reddedildi"}</td></tr>)}</tbody></table></div>}</section>
  </div></main>;
}
