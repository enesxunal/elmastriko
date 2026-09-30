import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";

const flow=["paid","invoice_pending","ready_to_ship","shipped","delivered"];
const labels:Record<string,string>={
  paid:"Ödeme alındı",
  invoice_pending:"Fatura hazırlanıyor",
  ready_to_ship:"Kargoya hazırlanıyor",
  shipped:"Kargoya verildi",
  delivered:"Teslim edildi",
};

export default async function AccountOrderDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params; const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/hesabim");
  const [{data:order},{data:items},{data:addresses},{data:shipments},{data:invoices}] = await Promise.all([
    supabase.from("orders").select("id,order_no,status,payment_status,subtotal,shipping_fee,discount_total,grand_total,currency,created_at").eq("id",id).maybeSingle(),
    supabase.from("order_items").select("id,product_name,sku,color,size,unit_price,quantity,line_total").eq("order_id",id),
    supabase.from("order_addresses").select("kind,full_name,company_name,phone,city,district,postal_code,address_line").eq("order_id",id),
    supabase.from("shipments").select("provider,tracking_code,tracking_url,status,created_at").eq("order_id",id).order("created_at",{ascending:false}),
    supabase.from("invoices").select("provider,invoice_no,status,created_at").eq("order_id",id).order("created_at",{ascending:false}),
  ]);
  if(!order)notFound();

  const activeIndex=Math.max(0,flow.indexOf(order.status));
  const shipment=shipments?.[0];
  const invoice=invoices?.[0];

  return <><StoreHeader/><main className="order-detail-page premium-order-detail">
    <div className="order-detail-topbar"><Link className="checkout-back" href="/hesabim">← Hesabıma dön</Link><span>{new Date(order.created_at).toLocaleString("tr-TR")}</span></div>

    <div className="order-detail-head">
      <div><span>SİPARİŞ</span><h1>{order.order_no}</h1><p>Siparişinizin tüm aşamalarını ve belgelerini buradan takip edebilirsiniz.</p></div>
      <div><b className={"customer-status-badge "+(order.payment_status==="paid"?"success":"")}>{order.payment_status==="paid"?"Ödeme Onaylandı":order.payment_status}</b><span>{labels[order.status]||order.status}</span></div>
    </div>

    <section className="order-progress-card">
      {flow.map((step,index)=><div key={step} className={"order-progress-step "+(index<=activeIndex?"active":"")}>
        <i>{index<activeIndex?"✓":String(index+1).padStart(2,"0")}</i>
        <div><b>{labels[step]}</b><span>{index<activeIndex?"Tamamlandı":index===activeIndex?"Mevcut aşama":"Bekliyor"}</span></div>
      </div>)}
    </section>

    <section className="order-detail-grid">
      <div className="order-detail-main">
        <div className="order-card-title"><span>ÜRÜNLER</span><h2>Sipariş içeriği</h2></div>
        {items?.map(i=><article className="order-detail-item" key={i.id}>
          <div><b>{i.product_name}</b><span>{i.color||"Standart"} {i.size?"· "+i.size:""} {i.sku?"· "+i.sku:""}</span></div>
          <span>{i.quantity} adet</span>
          <strong>{Number(i.line_total).toLocaleString("tr-TR")} TL</strong>
        </article>)}
      </div>
      <aside className="order-total-card">
        <div className="order-card-title"><span>ÖZET</span><h2>Ödeme özeti</h2></div>
        <p><span>Ara toplam</span><b>{Number(order.subtotal).toLocaleString("tr-TR")} TL</b></p>
        <p><span>Kargo</span><b>{Number(order.shipping_fee).toLocaleString("tr-TR")} TL</b></p>
        {Number(order.discount_total)>0&&<p><span>İndirim</span><b>-{Number(order.discount_total).toLocaleString("tr-TR")} TL</b></p>}
        <p className="order-grand-total"><span>Toplam</span><b>{Number(order.grand_total).toLocaleString("tr-TR")} TL</b></p>
      </aside>
    </section>

    <section className="order-support-grid premium-support-grid">
      <article><div className="order-card-title"><span>TESLİMAT</span><h2>Adres bilgileri</h2></div>{addresses?.map((a,i)=><div className="order-info-block" key={i}><b>{a.kind==="shipping"?"Teslimat adresi":"Fatura adresi"}</b><p>{a.full_name}<br/>{a.address_line}<br/>{a.district} / {a.city}{a.postal_code?" · "+a.postal_code:""}{a.phone?<><br/>{a.phone}</>:null}</p></div>)}</article>
      <article><div className="order-card-title"><span>KARGO</span><h2>Gönderi durumu</h2></div>{shipment?<div className="order-info-block"><b>{shipment.provider} · {shipment.status}</b><p>{shipment.tracking_code||"Takip kodu bekleniyor"}</p>{shipment.tracking_url&&<a href={shipment.tracking_url} target="_blank">Kargoyu takip et →</a>}</div>:<p className="order-muted">Gönderi henüz oluşturulmadı.</p>}</article>
      <article><div className="order-card-title"><span>FATURA</span><h2>Belge bilgileri</h2></div>{invoice?<div className="order-info-block"><b>{invoice.provider}</b><p>{invoice.invoice_no||"Fatura numarası bekleniyor"}<br/>Durum: {invoice.status}</p></div>:<p className="order-muted">Fatura henüz oluşturulmadı.</p>}</article>
    </section>
  </main><StoreFooter/></>;
}
