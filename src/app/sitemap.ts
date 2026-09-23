import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.elmastriko.com";
  const staticRoutes = ["","/kadin","/erkek","/yeni-gelenler","/blog","/hakkimizda","/iletisim","/kargo-iade","/kvkk","/mesafeli-satis"];
  const supabase=await createClient();
  const [{data:products},{data:posts}] = await Promise.all([
    supabase.from("products").select("slug,updated_at").eq("is_active",true),
    supabase.from("blog_posts").select("slug,updated_at").eq("status","published")
  ]);
  return [
    ...staticRoutes.map(path=>({url:base+path,lastModified:new Date(),changeFrequency:path===""?"daily" as const:"weekly" as const,priority:path===""?1:0.7})),
    ...(products||[]).map(p=>({url:`${base}/urun/${p.slug}`,lastModified:p.updated_at?new Date(p.updated_at):new Date(),changeFrequency:"weekly" as const,priority:0.8})),
    ...(posts||[]).map(p=>({url:`${base}/blog/${p.slug}`,lastModified:p.updated_at?new Date(p.updated_at):new Date(),changeFrequency:"monthly" as const,priority:0.6}))
  ];
}
