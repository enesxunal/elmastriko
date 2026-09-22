import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { updateOrderStatus } from "../actions";

const statuses=["draft","awaiting_payment","paid","invoice_pending","ready_to_ship","shipped","delivered","cancelled","refunded"];

export default async function OrdersAdmin(){
  const {supabase}=await requireAdmin();
  const {data:orders}=await supabase.from("orders").select("id,order_no,status,payment_status,grand_total,currency,guest_email,guest_phone,created_at").order("created_at",{ascending:false}).limit(100);
  return <main className="admin-page">
    <div className="admin-page-head"><div><span>OPERASYON</span><h1>Siparişler</h1></div><p>Ödeme, fatura, kargo ve teslimat durumlarını yönetin.</p></div>
    <div className="admin-table admin-orders">{orders?.length?orders.map(o=><div className="admin-row" key={o.id}>
      <div><Link href={"/yonetim/siparisler/"+o.id}><b>{o.order_no}</b></Link><small>{new Date(o.created_at).toLocaleString("tr-TR")}</small></div>
      <div><span>{o.guest_email||"Üye"}</span><small>{o.guest_phone||""}</small></div>
      <strong>{Number(o.grand_total).toLocaleString("tr-TR")} {o.currency}</strong>
      <span>{o.payment_status}</span>
      <form action={updateOrderStatus}><input type="hidden" name="id" value={o.id}/><select name="status" defaultValue={o.status}>{statuses.map(s=><option key={s}>{s}</option>)}</select><button>Kaydet</button></form>
    </div>):<div className="admin-empty">Sipariş bulunmuyor.</div>}</div>
  </main>;
}
