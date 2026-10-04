import type { Metadata } from "next";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { company } from "@/lib/company";

const siteUrl = "https://www.elmastriko.com";

export const metadata: Metadata = {
  title: "Elmas Triko Hakkında | Resmi Marka ve Online Mağaza",
  description: "Elmas Triko markasını, kadın ve erkek triko koleksiyonlarını ve resmi şirket bilgilerini keşfedin. Elmas Triko resmi online mağazası hakkında bilgi alın.",
  alternates: { canonical: "/hakkimizda" },
  openGraph: {
    title: "Elmas Triko Hakkında | Resmi Marka",
    description: "Elmas Triko markası, koleksiyon yaklaşımı ve resmi şirket bilgileri.",
    url: `${siteUrl}/hakkimizda`,
    type: "website",
  },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context":"https://schema.org",
    "@type":"AboutPage",
    "@id":`${siteUrl}/hakkimizda#about`,
    url:`${siteUrl}/hakkimizda`,
    name:"Elmas Triko Hakkında",
    description:"Elmas Triko markası, koleksiyon yaklaşımı ve resmi şirket bilgileri.",
    mainEntity:{ "@id":`${siteUrl}/#organization` },
    inLanguage:"tr-TR",
  };

  const breadcrumbSchema = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    itemListElement:[
      { "@type":"ListItem", position:1, name:"Ana Sayfa", item:siteUrl },
      { "@type":"ListItem", position:2, name:"Elmas Triko Hakkında", item:`${siteUrl}/hakkimizda` },
    ]
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(aboutSchema)}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbSchema)}}/>
    <StoreHeader/>
    <main className="content-page">
      <section className="content-hero"><span>ELMAS TRİKO</span><h1>Elmas Triko hakkında.</h1><p>Kadın ve erkek koleksiyonlarında güncel form, desen ve günlük kullanım odağını bir araya getiren Elmas Triko; resmi online mağazasında aynı yalın ve güçlü marka dilini sürdürüyor.</p></section>
      <section className="content-grid">
        <article><span>01</span><h2>Elmas Triko</h2><p>Elmas Triko koleksiyonları ağırlıklı olarak kadın triko, hırka, kazak ve takım modellerinden oluşur; erkek koleksiyonu da ürün gamının bir parçasıdır.</p></article>
        <article><span>02</span><h2>Koleksiyon yaklaşımı</h2><p>Ürün seçkisinde zamansız triko parçaları, desenli modeller, hırkalar ve sezonluk koleksiyonlar ön plandadır. Güncel ürünler resmi online mağazada renk, beden ve stok bilgileriyle sunulur.</p></article>
        <article><span>03</span><h2>Resmi şirket bilgileri</h2><p>{company.legalName}<br/>{company.address}<br/>MERSİS: {company.mersis}</p></article>
      </section>
    </main>
    <StoreFooter/>
  </>;
}
