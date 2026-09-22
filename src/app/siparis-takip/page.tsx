import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type TrackedItem={name:string;quantity:number;size?:string|null;color?:string|null};
type TrackedShipment={provider:string;status:string;trackingCode?:string|null;trackingUrl?:string|null};
type TrackedOrder={orderNo:string;status:string;paymentStatus:string;grandTotal:number|string;currency:string;createdAt:string;items:TrackedItem[];shipment?:TrackedShipment|null};

export default async function OrderTrackingPage({searchParams}:{searchParams:Promise<{order?:string;email?:string}>}) {
  const q=await searchParams;
  let result:TrackedOrder|null=null;
  let searched=false;
  if(q.order&&q.email){
    searched=true;
    const supabase=await createClient();
    const {data}=await supabase.rpc("track_store_order",{p_order_no:q.order,p_email:q.email});
    result=(data as TrackedOrder|null) || null;
  }

  return <><StoreHeader/><main className="content-page">
    <section className="content-hero">
      <span>SİPARİŞ TAKİBİ</span><h1>Siparişinizi takip edin.</h1>
      <p>Üyelik olmadan verdiğiniz siparişlerde sipariş numaranız ve satın alma sırasında kullandığınız e-posta adresiniz yeterlidir.</p>
      <form className="tracking-form" method="get"><input name="order" placeholder="Sipariş no (ET-...)" defaultValue={q.order||""} required/><input name="email" type="email" placeholder="E-posta" defaultValue={q.email||""} required/><button>Takip Et</button></form>
    </section>
    {searched&&(result?<section className="tracking-result">
      <div><span>SİPARİŞ</span><h2>{result.orderNo}</h2><p>{new Date(result.createdAt).toLocaleString("tr-TR")}</p></div>
      <div className="tracking-status"><b>{result.status}</b><span>Ödeme: {result.paymentStatus}</span></div>
      <div className="tracking-items">{result.items?.map((item,idx)=><p key={idx}><b>{item.name}</b><span>{item.quantity} adet · {item.size||""} {item.color||""}</span></p>)}</div>
      <div className="tracking-total">Toplam <b>{Number(result.grandTotal).toLocaleString("tr-TR")} {result.currency}</b></div>
      {result.shipment&&<div className="tracking-shipment"><span>{result.shipment.provider}</span><b>{result.shipment.status}</b><p>{result.shipment.trackingCode||"Takip kodu bekleniyor"}</p>{result.shipment.trackingUrl&&<a href={result.shipment.trackingUrl} target="_blank" rel="noreferrer">Kargoyu takip et →</a>}</div>}
    </section>:<section className="tracking-not-found"><h2>Sipariş bulunamadı.</h2><p>Sipariş numarası ve e-posta adresini kontrol edin.</p></section>)}
    <section className="tracking-options"><Link href="/hesabim"><span>ÜYE SİPARİŞLERİ</span><h2>Hesabımdan görüntüle</h2><p>Sipariş geçmişi, ödeme ve teslimat durumu.</p></Link><div><span>YARDIM</span><h2>Bir sorun mu var?</h2><p>İletişim bilgilerimiz tamamlandığında destek kanalına buradan ulaşabileceksiniz.</p></div></section>
  </main><StoreFooter/></>;
}
