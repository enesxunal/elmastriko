import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";

export default async function AccountOrderDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params; const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect('/hesabim');
  const [{data:order},{data:items},{data:addresses},{data:shipments},{data:invoices}] = await Promise.all([
    supabase.from('orders').select('id,order_no,status,payment_status,subtotal,shipping_fee,discount_total,grand_total,currency,created_at').eq('id',id).maybeSingle(),
    supabase.from('order_items').select('id,product_name,sku,color,size,unit_price,quantity,line_total').eq('order_id',id),
    supabase.from('order_addresses').select('kind,full_name,company_name,phone,city,district,postal_code,address_line').eq('order_id',id),
    supabase.from('shipments').select('provider,tracking_code,tracking_url,status,created_at').eq('order_id',id).order('created_at',{ascending:false}),
    supabase.from('invoices').select('provider,invoice_no,status,created_at').eq('order_id',id).order('created_at',{ascending:false}),
  ]);
  if(!order)notFound();
  return <><StoreHeader/><main className="order-detail-page"><Link className="checkout-back" href="/hesabim">← Hesabıma dön</Link><div className="order-detail-head"><div><span>SİPARİŞ</span><h1>{order.order_no}</h1><p>{new Date(order.created_at).toLocaleString('tr-TR')}</p></div><div><b>{order.status}</b><span>Ödeme: {order.payment_status}</span></div></div>
    <section className="order-detail-grid"><div className="order-detail-main"><h2>Ürünler</h2>{items?.map(i=><article className="order-detail-item" key={i.id}><div><b>{i.product_name}</b><span>{i.color||''} {i.size?`· ${i.size}`:''} {i.sku?`· ${i.sku}`:''}</span></div><span>{i.quantity} adet</span><strong>{Number(i.line_total).toLocaleString('tr-TR')} TL</strong></article>)}</div><aside><h2>Özet</h2><p><span>Ara toplam</span><b>{Number(order.subtotal).toLocaleString('tr-TR')} TL</b></p><p><span>Kargo</span><b>{Number(order.shipping_fee).toLocaleString('tr-TR')} TL</b></p><p><span>Toplam</span><b>{Number(order.grand_total).toLocaleString('tr-TR')} TL</b></p></aside></section>
    <section className="order-support-grid"><article><h2>Teslimat & Fatura</h2>{addresses?.map((a,i)=><p key={i}><b>{a.kind==='shipping'?'Teslimat':'Fatura'}</b><br/>{a.full_name}<br/>{a.address_line}<br/>{a.district} / {a.city}</p>)}</article><article><h2>Kargo</h2>{shipments?.length?shipments.map((s,i)=><p key={i}>{s.provider} · {s.status}<br/>{s.tracking_code||'Takip kodu bekleniyor'}{s.tracking_url&&<><br/><a href={s.tracking_url} target="_blank">Kargoyu takip et →</a></>}</p>):<p>Gönderi henüz oluşturulmadı.</p>}</article><article><h2>Fatura</h2>{invoices?.length?invoices.map((inv,i)=><p key={i}>{inv.provider} · {inv.status}<br/>{inv.invoice_no||'Fatura numarası bekleniyor'}</p>):<p>Fatura henüz oluşturulmadı.</p>}</article></section>
  </main><StoreFooter/></>;
}
