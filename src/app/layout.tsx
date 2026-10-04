import type { Metadata } from "next";
import { StoreProvider } from "@/components/StoreProvider";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { createPublicClient } from "@/lib/supabase/public";
import "./globals.css";

const siteUrl = "https://www.elmastriko.com";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Elmas Triko | Kadın ve Erkek Triko Online Mağaza";
  let description = "Elmas Triko resmi online mağazası. Kadın ve erkek triko, hırka, kazak ve yeni sezon koleksiyonlarını keşfedin.";
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
    "@type":"Organization",
    "@id": `${siteUrl}/#organization`,
    name:"Elmas Triko",
    legalName:"ELMAS TRİKO SANAYİ VE TİCARET LİMİTED ŞİRKETİ",
    url:siteUrl,
    logo:`${siteUrl}/elmas-triko.png`,
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
    publisher:{ "@id": `${siteUrl}/#organization` },
    inLanguage:"tr-TR",
    potentialAction:{
      "@type":"SearchAction",
      target:`${siteUrl}/arama?q={search_term_string}`,
      "query-input":"required name=search_term_string"
    }
  };

  return <html lang="tr"><body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organization)}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(website)}}/>
    <AnalyticsTracker/>
    <StoreProvider>{children}</StoreProvider>
  </body></html>;
}
