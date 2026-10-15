import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { money, type Influencer } from "@/lib/influencer";
import { decideInfluencerPayout, inviteInfluencer, saveInfluencer } from "./actions";
import "@/app/influencer/influencer.css";

export const metadata: Metadata = { title: "Influencer İş Birlikleri", robots: { index:false,follow:false } };
export const dynamic = "force-dynamic";

function FormFields({ influencer }: { influencer?: Influencer }) {
  const i = influencer;
  return <>
    {i?.id && <input type="hidden" name="id" value={i.id}/>}
    <div className="affiliate-form-grid">
      <label>Ad Soyad<input required name="full_name" defaultValue={i?.full_name||""} placeholder="Ad Soyad"/></label>
      <label>Giriş ve davet e-postası<input type="email" name="email" defaultValue={i?.email||""} placeholder="influencer@ornek.com"/></label>
      <label>Instagram<input name="instagram_handle" defaultValue={i?.instagram_handle||""} placeholder="kullaniciadi"/></label>
      <label>Kişisel link (ref)<input required name="slug" pattern="[a-z0-9-]{2,40}" defaultValue={i?.slug||""} placeholder="sena"/></label>
      <label>İndirim kodu<input required name="code" pattern="[A-Za-z0-9]{3,32}" defaultValue={i?.code||""} placeholder="SENA5"/></label>
      <label>İş birliği durumu<select name="status" defaultValue={i?.status||"draft"}>
        <option value="draft">Taslak (kod kapalı)</option><option value="active">Aktif</option><option value="paused">Duraklatıldı</option>
      </select></label>
      <label>Müşteri indirimi (%)<input name="discount_percent" type="number" min="0" max="30" step="0.01" defaultValue={i?.discount_percent??5}/></label>
      <label>Komisyon (%)<input name="commission_percent" type="number" min="0" max="30" step="0.01" defaultValue={i?.commission_percent??5}/></label>
      <label>KDV (%)<input name="vat_percent" type="number" min="0" max="30" step="0.01" defaultValue={i?.vat_percent??10}/></label>
      <label>Gönderilen hediye ürün<input name="gift_product" defaultValue={i?.gift_product||""}/></label>
      <label>Reels bağlantısı<input type="url" name="reels_url" defaultValue={i?.reels_url||""} placeholder="https://instagram.com/..."/></label>
      <label>Story bağlantısı<input type="url" name="story_url" defaultValue={i?.story_url||""} placeholder="https://instagram.com/..."/></label>
    </div>
    <div className="affiliate-checks">
      <label><input type="checkbox" name="reels_done" defaultChecked={i?.reels_done}/> Reels paylaşıldı</label>
      <label><input type="checkbox" name="story_done" defaultChecked={i?.story_done}/> Story paylaşıldı</label>
    </div>
    <button type="submit" className="affiliate-button">Bilgileri kaydet</button>
  </>;
}

type Payout = { id:string; influencer_id:string;amount:number;status:string;requested_at:string;payment_reference:string|null };
type Attribution = { influencer_id:string;commission_amount:number;discount_amount:number;order_id:string;orders:{payment_status:string;status:string;delivered_at:string|null}|{payment_status:string;status:string;delivered_at:string|null}[]|null };

export default async function AdminInfluencers({searchParams}:{searchParams:Promise<{message?:string;error?:string}>}) {
  await requireAdmin();
  const admin = createAdminClient();
  const params = await searchParams;
  const [partners, payouts, attributions, clicks] = await Promise.all([
    admin.from("influencers").select("*").order("created_at",{ascending:true}),
    admin.from("influencer_payout_requests").select("*").order("requested_at",{ascending:false}).limit(100),
    admin.from("influencer_orders").select("influencer_id,commission_amount,discount_amount,order_id,orders(payment_status,status,delivered_at)").limit(3000),
    admin.from("influencer_clicks").select("influencer_id").limit(10000),
  ]);
  const list = (partners.data||[]) as Influencer[];
  const payoutsList = (payouts.data||[]) as Payout[];
  const ordersList = (attributions.data||[]) as Attribution[];
  const byId = Object.fromEntries(list.map(i=>[i.id,i]));
  const now = Date.now();
  const totals = {
    visits: clicks.data?.length||0,
    attributed: ordersList.length,
    pendingRequests: payoutsList.filter(p=>p.status==="pending").length,
    commissions: ordersList.reduce((sum,row)=>sum+Number(row.commission_amount||0),0),
  };
  return <main className="admin-page affiliate-admin-page">
    <div className="admin-page-head"><div><span>İŞ BİRLİKLERİ</span><h1>Influencer Programı</h1><p>Şifre oluşturma daveti, kod, kampanya performansı ve komisyon taleplerini buradan yönetin.</p></div></div>
    {params.error&&<p className="affiliate-alert error" role="alert">{params.error}</p>}
    {params.message&&<p className="affiliate-alert success" role="status">{params.message}</p>}
    <section className="affiliate-stat-grid">
      <article><span>Influencer</span><strong>{list.length}</strong><small>{list.filter(p=>p.status==="active").length} aktif</small></article>
      <article><span>Bağlantı tıklaması</span><strong>{totals.visits}</strong><small>Tekil günlük ziyaret</small></article>
      <article><span>Kodlu sipariş</span><strong>{totals.attributed}</strong><small>Ödeme bekleyenler dahil</small></article>
      <article><span>Bekleyen ödeme talebi</span><strong>{totals.pendingRequests}</strong><small>Min. 1.000 TL</small></article>
    </section>
    <section className="affiliate-card">
      <h2>Ödeme talepleri</h2>
      {payoutsList.length===0?<p className="affiliate-muted">Henüz ödeme talebi yok.</p>:<div className="affiliate-table-wrap"><table className="affiliate-table"><thead><tr><th>Influencer</th><th>Talep</th><th>Tarih</th><th>Durum / İşlem</th></tr></thead><tbody>
        {payoutsList.map(p=><tr key={p.id}>
          <td>{byId[p.influencer_id]?.full_name||"Influencer"}</td><td><b>{money(p.amount)}</b></td><td>{new Date(p.requested_at).toLocaleDateString("tr-TR")}</td>
          <td>{p.status==="pending" ? <div className="affiliate-decision">
            <form action={decideInfluencerPayout}><input type="hidden" name="request_id" value={p.id}/><input type="hidden" name="decision" value="paid"/><input aria-label="Havale referansı" name="reference" placeholder="Banka işlem referansı"/><button type="submit" className="affiliate-button">Ödendi olarak işaretle</button></form>
            <form action={decideInfluencerPayout}><input type="hidden" name="request_id" value={p.id}/><input type="hidden" name="decision" value="rejected"/><button type="submit" className="affiliate-button secondary">Reddet</button></form>
          </div> : p.status==="paid"?"Ödendi":"Reddedildi"}</td>
        </tr>)}
      </tbody></table></div>}
      <p className="affiliate-muted">Ödemeler banka üzerinden manuel yapılır. "Ödendi" işaretlemesi gerçek transferin ardından yapılmalıdır.</p>
    </section>
    <section className="affiliate-card"><h2>Yeni influencer ekle</h2><p className="affiliate-muted">E-posta adresini doğruladıktan sonra profili aktif edin. Şifre oluşturma daveti yalnızca aktif profillere gönderilir.</p><form action={saveInfluencer}><FormFields/></form></section>
    <h2 className="affiliate-section-title">İş birlikleri</h2>
    {list.map(i=>{
      const attributed = ordersList.filter(a=>a.influencer_id===i.id);
      const eligible = attributed.filter(a=>{const o=Array.isArray(a.orders)?a.orders[0]:a.orders;return o?.payment_status==="paid"&&o.status==="delivered"&&!!o.delivered_at&&new Date(o.delivered_at).getTime()+14*86400000<=now});
      const requests = payoutsList.filter(p=>p.influencer_id===i.id&&["pending","paid"].includes(p.status));
      const available = Math.max(0,eligible.reduce((s,a)=>s+Number(a.commission_amount),0)-requests.reduce((s,p)=>s+Number(p.amount),0));
      return <section key={i.id} className="affiliate-card">
        <div className="affiliate-card-title"><div><h3>{i.full_name}</h3><small>@{i.instagram_handle||"instagram tanımlanmadı"} · <b>{i.code}</b> · {i.status==="active"?"Aktif":i.status==="draft"?"Taslak":"Duraklatıldı"}</small></div><div className="affiliate-card-kpis"><span>{clicks.data?.filter(c=>c.influencer_id===i.id).length||0} tıklama</span><span>{attributed.length} sipariş</span><b>{money(available)} çekilebilir</b></div></div>
        <p className="affiliate-muted">Paylaşım linki: <Link href={"/?ref="+i.slug} target="_blank">elmastriko.com/?ref={i.slug}</Link></p>
        <details><summary>Bilgileri, oranları ve teslimatları düzenle</summary><form action={saveInfluencer} className="affiliate-edit-form"><FormFields influencer={i}/></form></details>
        <div className="affiliate-invite-row"><span>{i.email||"Davet e-postası henüz eklenmedi"} {i.invite_sent_at&&<small> · Son davet: {new Date(i.invite_sent_at).toLocaleString("tr-TR")}</small>}</span>
          <form action={inviteInfluencer}><input type="hidden" name="id" value={i.id}/><button type="submit" className="affiliate-button" disabled={i.status!=="active"||!i.email}>{i.invite_sent_at?"Şifre oluşturma bağlantısını yeniden gönder":"Şifre oluşturma daveti gönder"}</button></form>
        </div>
      </section>;
    })}
  </main>;
}
