import type { Metadata } from "next";
import { StoreProvider } from "@/components/StoreProvider";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { createPublicClient } from "@/lib/supabase/public";
import "./globals.css";

const siteUrl = "https://www.elmastriko.com";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Elmas Triko | Kadın & Erkek Triko";
  let description = "Elmas Triko kadın ve erkek koleksiyonları. Yeni sezon triko, hırka, kazak ve zamansız parçalar.";
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
    openGraph: { type:"website", locale:"tr_TR", siteName:"Elmas Triko", title, description, url:siteUrl },
    twitter: { card:"summary_large_image", title, description },
    robots: { index:true, follow:true },
    icons: { icon: "/favicon.png", apple: "/favicon.png" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organization = {"@context":"https://schema.org","@type":"Organization","name":"Elmas Triko","url":siteUrl,"address":{"@type":"PostalAddress","streetAddress":"Merkez Mah. 716. Sk. No: 8 İç Kapı No: 31","addressLocality":"Bağcılar","addressRegion":"İstanbul","addressCountry":"TR"}};
  return <html lang="tr"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organization)}}/><AnalyticsTracker/><StoreProvider>{children}</StoreProvider></body></html>;
}
