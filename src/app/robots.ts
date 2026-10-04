import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base="https://www.elmastriko.com";
  return {
    rules:{
      userAgent:"*",
      allow:"/",
      disallow:[
        "/yonetim/",
        "/api/",
        "/checkout",
        "/sepet",
        "/favoriler",
        "/hesabim/",
        "/arama",
        "/siparis-basarili",
        "/siparis-takip"
      ]
    },
    sitemap:`${base}/sitemap.xml`,
    host:base,
  };
}
