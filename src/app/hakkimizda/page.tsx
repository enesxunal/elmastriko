import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { company } from "@/lib/company";

export default function AboutPage() {
  return <><StoreHeader/><main className="content-page">
    <section className="content-hero"><span>ELMAS TRİKO</span><h1>Trikoda modern bir çizgi.</h1><p>Kadın ve erkek koleksiyonlarında güncel form, desen ve günlük kullanım odağını bir araya getiren Elmas Triko; e-ticaret kanalında da aynı yalın ve güçlü marka dilini sürdürüyor.</p></section>
    <section className="content-grid">
      <article><span>01</span><h2>Marka</h2><p>Elmas Triko koleksiyonları ağırlıklı olarak kadın ürünlerinden oluşur; erkek koleksiyonu da ürün gamının bir parçasıdır.</p></article>
      <article><span>02</span><h2>Yaklaşım</h2><p>Ürün seçkisinde zamansız triko parçaları, desenli modeller, hırkalar ve sezonluk koleksiyonlar ön plandadır.</p></article>
      <article><span>03</span><h2>Şirket</h2><p>{company.legalName}<br/>{company.address}<br/>MERSİS: {company.mersis}</p></article>
    </section>
  </main><StoreFooter/></>;
}
