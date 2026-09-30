import Link from "next/link";
import { CheckCircle2, Clock3, PackageCheck, ShoppingBag } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { updateOrderStatus } from "../actions";

const statuses=["draft","awaiting_payment","paid","invoice_pending","ready_to_ship","shipped","delivered","cancelled","refunded"];

function statusLabel(value:string){
  const labels:Record<string,string>={
    draft:"Taslak",awaiting_payment:"Ödeme Bekliyor",paid:"Ödendi",invoice_pending:"Fatura Bekliyor",
    ready_to_ship:"Kargoya Hazır",shipped:"Kargoda",delivered:"Teslim Edildi",cancelled:"İptal",refunded:"İade"
  };
  return labels[value]||value;
}

export default async function OrdersAdmin(){
  const {supabase}=await requireAdmin();
  const {data:orders}=await supabase.from("orders").select("id,order_no,status,payment_status,grand_total,currency,guest_email,guest_phone,created_at").order("created_at",{ascending:false}).limit(100);

  const list=orders||[];
  const paid=list.filter(o=>o.payment_status==="paid").length;
  const waiting=list.filter(o=>o.payment_status==="pending"||o.status==="awaiting_payment").length;
  const shipping=list.filter(o=>["ready_to_ship","shipped"].includes(o.status)).length;
  const revenue=list.filter(o=>o.payment_status==="paid"&&!["cancelled","refunded"].includes(o.status)).reduce((sum,o)=>sum+Number(o.grand_total||0),0);

  return <main className="admin-page admin-orders-page">
    <div className="admin-page-head admin-orders-head">
      <div><span>OPERASYON</span><h1>Siparişler</h1><p>Ödeme, fatura, hazırlık ve teslimat akışını tek ekrandan yönetin.</p></div>
    </div>

    <section className="admin-order-kpis">
      <article><span><ShoppingBag size={16}/> Toplam sipariş</span><strong>{list.length}</strong><small>Son 100 kayıt</small></article>
      <article><span><CheckCircle2 size={16}/> Ödemesi tamamlanan</span><strong>{paid}</strong><small>{revenue.toLocaleString("tr-TR")} TL ciro</small></article>
      <article><span><Clock3 size={16}/> Aksiyon bekleyen</span><strong>{waiting}</strong><small>Ödeme veya işlem bekliyor</small></article>
      <article><span><PackageCheck size={16}/> Kargo sürecinde</span><strong>{shipping}</strong><small>Hazır veya gönderildi</small></article>
    </section>

    <section className="admin-orders-card">
      <div className="admin-orders-table-head"><span>Sipariş</span><span>Müşteri</span><span>Tutar</span><span>Ödeme</span><span>Durum</span></div>
      {list.length?list.map(o=><div className="admin-order-table-row" key={o.id}>
        <div className="admin-order-identity"><Link href={"/yonetim/siparisler/"+o.id}><b>{o.order_no}</b></Link><small>{new Date(o.created_at).toLocaleString("tr-TR")}</small></div>
        <div className="admin-order-customer"><span>{o.guest_email||"Üye kullanıcı"}</span><small>{o.guest_phone||"Telefon yok"}</small></div>
        <strong className="admin-order-price">{Number(o.grand_total).toLocaleString("tr-TR")} {o.currency}</strong>
        <span className={"status-badge "+(o.payment_status==="paid"?"active":"")}>{o.payment_status==="paid"?"Ödendi":o.payment_status}</span>
        <form action={updateOrderStatus} className="admin-order-status-form">
          <input type="hidden" name="id" value={o.id}/>
          <select name="status" defaultValue={o.status}>{statuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select>
          <button>Kaydet</button>
        </form>
      </div>):<div className="admin-empty-state"><ShoppingBag size={24}/><b>Sipariş bulunmuyor</b><span>Yeni siparişler burada görünecek.</span></div>}
    </section>
  </main>;
}
