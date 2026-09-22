import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";

export default function MenPage() {
  return <><StoreHeader/><main className="listing-page">
    <div className="listing-hero men-listing"><span>MEN / 2026</span><h1>Erkek</h1><p>Erkek ürün listesi geldiğinde koleksiyon burada yayınlanacak.</p></div>
    <section className="empty-collection"><span>ELMAS TRİKO</span><h2>Erkek koleksiyonu hazırlanıyor.</h2><p>Ürün fotoğrafları, beden ve fiyat bilgileri geldiğinde bu alan otomatik olarak ürün gridine dönüşecek.</p></section>
  </main><StoreFooter/></>;
}
