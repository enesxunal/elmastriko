import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { approveBankTransfer, createBasitKargoShipment, createNesInvoice, rejectBankTransfer, saveInvoice, savePaymentRecord, saveShipment, updateOrderStatus } from "../../actions";
import { BANK_TRANSFER, bankTransferStatusLabel } from "@/lib/payments/bank-transfer";

const orderStatuses=["draft","awaiting_payment","paid","invoice_pending","ready_to_ship","shipped","delivered","cancelled","refunded"];
const paymentStatuses=["pending","customer_notified","paid","rejected","failed","refunded","cancelled"];
export default async function AdminOrderDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const {supabase}=await requireAdmin();
  const [{data:order},{data:items},{data:addresses},{data:payment},{data:shipment},{data:invoice}] = await Promise.all([
    supabase.from("orders").select("id,order_no,user_id,guest_email,guest_phone,status,payment_status,subtotal,shipping_fee,discount_total,grand_total,currency,created_at,notes").eq("id",id).maybeSingle(),
    supabase.from("order_items").select("id,product_name,sku,color,size,unit_price,quantity,line_total").eq("order_id",id),
    supabase.from("order_addresses").select("id,kind,full_name,company_name,tax_office,tax_number,phone,city,district,postal_code,address_line").eq("order_id",id),
    supabase.from("payments").select("id,provider,provider_reference,amount,status,created_at").eq("order_id",id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("shipments").select("id,provider,tracking_code,tracking_url,status,created_at").eq("order_id",id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("invoices").select("id,provider,invoice_no,status,created_at").eq("order_id",id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
  ]);
  if(!order)notFound();
  return <main className="admin-page"><div className="admin-breadcrumb"><Link href="/yonetim/siparisler">← Siparişler</Link></div><div className="admin-page-head"><div><span>SİPARİŞ</span><h1>{order.order_no}</h1></div><p>{new Date(order.created_at).toLocaleString("tr-TR")} · {order.guest_email||"Üye kullanıcı"}</p></div>
    <section className="admin-order-summary"><article><span>Toplam</span><strong>{Number(order.grand_total).toLocaleString("tr-TR")} {order.currency}</strong></article><article><span>Sipariş</span><form action={updateOrderStatus}><input type="hidden" name="id" value={id}/><select name="status" defaultValue={order.status}>{orderStatuses.map(s=><option key={s}>{s}</option>)}</select><button>Güncelle</button></form></article><article><span>Ödeme</span><strong>{order.payment_status}</strong></article></section>
    <section className="admin-section"><div className="admin-section-head"><h2>Ürünler</h2></div><div className="admin-table">{items?.map(i=><div className="admin-row" key={i.id}><div><b>{i.product_name}</b><small>{i.sku||"SKU yok"}</small></div><span>{i.color||"—"} / {i.size||"—"}</span><span>{i.quantity} adet</span><strong>{Number(i.line_total).toLocaleString("tr-TR")} TL</strong></div>)}</div></section>
    <section className="admin-three-grid"><article><h2>Adresler</h2>{addresses?.map(a=><p key={a.id}><b>{a.kind}</b><br/>{a.full_name}{a.company_name?<><br/>{a.company_name}</>:null}<br/>{a.address_line}<br/>{a.district} / {a.city}{a.tax_number?<><br/>VKN/TCKN: {a.tax_number}</>:null}</p>)}</article>
      <article><h2>Kargo</h2>
        <div className="admin-alert success"><b>Sürat Kargo</b><span>BasitKargo entegrasyonu üzerinden yalnızca Sürat Kargo gönderisi oluşturulur.</span></div>
        <form action={createBasitKargoShipment} className="admin-editor"><input type="hidden" name="order_id" value={id}/><div className="form-grid"><input name="height" type="number" min="1" defaultValue="10" placeholder="Yükseklik cm"/><input name="width" type="number" min="1" defaultValue="15" placeholder="Genişlik cm"/><input name="depth" type="number" min="1" defaultValue="5" placeholder="Derinlik cm"/><input name="weight" type="number" min="0.1" step="0.1" defaultValue="1" placeholder="Ağırlık kg"/></div><button type="submit" disabled={order.payment_status!=="paid"}>Sürat Kargo gönderisi oluştur</button>{order.payment_status!=="paid"&&<small>Ödeme tamamlanınca aktif olur.</small>}</form>
        <hr/>
        <form action={saveShipment}><input type="hidden" name="order_id" value={id}/><div className="product-field"><label>Kargo firması</label><input value="Sürat Kargo" disabled/></div><input name="tracking_code" defaultValue={shipment?.tracking_code||""} placeholder="Takip kodu"/><input name="tracking_url" defaultValue={shipment?.tracking_url||""} placeholder="Takip URL"/><select name="status" defaultValue={shipment?.status||"pending"}><option>pending</option><option>prepared</option><option>shipped</option><option>delivered</option><option>returned</option><option>problem</option></select><button>Manuel kaydet</button></form>
      </article>
      <article><h2>Fatura</h2><form action={createNesInvoice} className="admin-editor"><input type="hidden" name="order_id" value={id}/><button type="submit" disabled={order.payment_status!=="paid"||invoice?.status==="sent"}>{invoice?.status==="sent"?"NES faturası gönderildi":"NES faturası oluştur ve gönder"}</button>{order.payment_status!=="paid"&&<small>Ödeme tamamlanınca aktif olur.</small>}{invoice?.invoice_no&&<small>Fatura no: {invoice.invoice_no}</small>}{invoice?.status==="sent"&&<div className="invoice-actions admin-invoice-actions"><a href={"/api/invoices/"+invoice.id+"/pdf"} target="_blank" rel="noreferrer">Faturayı Görüntüle</a><a href={"/api/invoices/"+invoice.id+"/pdf?download=1"}>PDF İndir</a></div>}</form><hr/><form action={saveInvoice}><input type="hidden" name="order_id" value={id}/><input name="provider" defaultValue={invoice?.provider||"NES Portal"}/><input name="invoice_no" defaultValue={invoice?.invoice_no||""} placeholder="Fatura no"/><select name="status" defaultValue={invoice?.status||"pending"}><option>pending</option><option>created</option><option>sent</option><option>cancelled</option><option>error</option></select><button>Manuel kaydet</button></form></article>
    </section>
    <section className="admin-section"><div className="admin-section-head"><h2>Ödeme Kaydı</h2></div>
      {payment?.provider===BANK_TRANSFER.provider&&<div className="admin-bank-transfer-card">
        <div><span>EFT / HAVALE</span><h3>{bankTransferStatusLabel(payment.status)}</h3></div>
        <div className="admin-bank-transfer-details">
          <p><span>Banka</span><b>{BANK_TRANSFER.bankName}</b></p>
          <p><span>Hesap sahibi</span><b>{BANK_TRANSFER.accountHolder}</b></p>
          <p><span>IBAN</span><b>{BANK_TRANSFER.iban}</b></p>
          <p><span>Açıklama / Sipariş kodu</span><b>{order.order_no}</b></p>
          <p><span>Tutar</span><b>{Number(payment.amount||order.grand_total).toLocaleString("tr-TR")} {order.currency}</b></p>
        </div>
        {payment.status==="customer_notified"&&<div className="admin-alert warning"><b>Müşteri ödeme yaptığını bildirdi.</b><span>Banka hesabını kontrol edip aşağıdan onaylayın veya ödeme bulunamadı olarak işaretleyin.</span></div>}
        {payment.status!=="paid"&&<div className="admin-bank-transfer-actions">
          <form action={approveBankTransfer}><input type="hidden" name="order_id" value={id}/><button className="admin-primary-button">Ödemeyi onayla</button></form>
          <form action={rejectBankTransfer}><input type="hidden" name="order_id" value={id}/><button className="danger-button">Ödeme bulunamadı</button></form>
        </div>}
      </div>}
      <form action={savePaymentRecord} className="admin-form-grid"><input type="hidden" name="order_id" value={id}/><input name="provider" defaultValue={payment?.provider||"manual"} placeholder="Provider"/><input name="provider_reference" defaultValue={payment?.provider_reference||""} placeholder="Referans"/><input name="amount" type="number" step="0.01" defaultValue={payment?.amount??order.grand_total}/><select name="status" defaultValue={payment?.status||order.payment_status}>{paymentStatuses.map(s=><option key={s} value={s}>{bankTransferStatusLabel(s)}</option>)}</select><button>Ödemeyi Güncelle</button></form>
    </section>
  </main>;
}
