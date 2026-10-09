import type { Metadata } from "next";
import Script from "next/script";
import { StoreProvider } from "@/components/StoreProvider";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { createPublicClient } from "@/lib/supabase/public";
import "./globals.css";

const siteUrl = "https://www.elmastriko.com";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Elmas Triko | Resmi Online Mağaza ve Triko Modelleri";
  let description = "Elmas Triko resmi online mağazası. Kadın triko, hırka, kazak, takım ve yeni sezon koleksiyonlarını keşfedin; güncel renk, beden ve stok seçeneklerini inceleyin.";
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key","seo").maybeSingle();
    const seo = data?.value as { defaultTitle?: string; defaultDescription?: string } | null;
    title = seo?.defaultTitle || title;
    description = seo?.defaultDescription || description;
  } catch {}

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: "%s | Elmas Triko" },
    description,
    applicationName: "Elmas Triko",
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: "Elmas Triko",
      title,
      description,
      url: siteUrl,
      images: [{ url: "/images/hero-banner.webp", alt: "Elmas Triko yeni sezon koleksiyonu" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/images/hero-banner.webp"] },
    robots: { index:true, follow:true },
    icons: { icon: "/favicon.png", apple: "/favicon.png" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organization = {
    "@context":"https://schema.org",
    "@type":["Organization","OnlineStore"],
    "@id": `${siteUrl}/#organization`,
    name:"Elmas Triko",
    alternateName:"Elmas Triko Online Mağaza",
    legalName:"ELMAS TRİKO SANAYİ VE TİCARET LİMİTED ŞİRKETİ",
    description:"Kadın ve erkek triko, hırka, kazak ve takım koleksiyonları sunan Elmas Triko resmi online mağazası.",
    url:siteUrl,
    logo:{ "@type":"ImageObject", url:`${siteUrl}/elmas-triko.png` },
    image:`${siteUrl}/images/hero-banner.webp`,
    brand:{ "@type":"Brand", name:"Elmas Triko" },
    email:"mailto:destek@elmastriko.com",
    areaServed:"TR",
    contactPoint:{ "@type":"ContactPoint", contactType:"customer service", email:"destek@elmastriko.com", availableLanguage:["tr"] },
    sameAs:["https://www.instagram.com/elmas_triko/"],
    address:{
      "@type":"PostalAddress",
      streetAddress:"Merkez Mah. 716. Sk. No: 8 İç Kapı No: 31",
      addressLocality:"Bağcılar",
      addressRegion:"İstanbul",
      addressCountry:"TR"
    }
  };
  const website = {
    "@context":"https://schema.org",
    "@type":"WebSite",
    "@id": `${siteUrl}/#website`,
    url:siteUrl,
    name:"Elmas Triko",
    alternateName:"Elmas Triko Resmi Online Mağaza",
    publisher:{ "@id": `${siteUrl}/#organization` },
    inLanguage:"tr-TR",
    potentialAction:{
      "@type":"SearchAction",
      target:`${siteUrl}/arama?q={search_term_string}`,
      "query-input":"required name=search_term_string"
    }
  };

  return <html lang="tr"><body>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-VSQ8W1YG0W" strategy="afterInteractive" />
    <Script id="google-analytics-init" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-VSQ8W1YG0W');
    `}</Script>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organization)}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(website)}}/>
    <AnalyticsTracker/>
    <StoreProvider>{children}</StoreProvider>
  </body></html>;
}
