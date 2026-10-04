import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { editorialPosts } from "@/lib/editorial-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.elmastriko.com";
  const supabase=await createClient();
  const [{data:products},{data:posts}] = await Promise.all([
    supabase.from("products").select("slug,updated_at,gender,product_type").eq("is_active",true),
    supabase.from("blog_posts").select("slug,updated_at").eq("status","published")
  ]);

  const hasMen=(products||[]).some(product=>product.gender==="erkek");
  const womenTypes=new Set((products||[]).filter(product=>product.gender==="kadin").map(product=>product.product_type));
  const womenCategoryRoutes=[
    ["Hırka","/kadin/hirka"],
    ["Kazak","/kadin/kazak"],
    ["Takım","/kadin/takim"],
    ["Triko","/kadin/triko"],
  ] as const;
  const staticRoutes = [
    {path:"",priority:1,changeFrequency:"daily" as const},
    {path:"/kadin",priority:.9,changeFrequency:"daily" as const},
    ...womenCategoryRoutes.filter(([type])=>womenTypes.has(type)).map(([,path])=>({path,priority:.86,changeFrequency:"daily" as const})),
    ...(hasMen?[{path:"/erkek",priority:.8,changeFrequency:"weekly" as const}]:[]),
    {path:"/yeni-gelenler",priority:.85,changeFrequency:"daily" as const},
    {path:"/blog",priority:.7,changeFrequency:"weekly" as const},
    {path:"/hakkimizda",priority:.6,changeFrequency:"monthly" as const},
    {path:"/iletisim",priority:.5,changeFrequency:"monthly" as const},
    {path:"/kargo-iade",priority:.4,changeFrequency:"monthly" as const},
    {path:"/kvkk",priority:.2,changeFrequency:"yearly" as const},
    {path:"/gizlilik",priority:.2,changeFrequency:"yearly" as const},
    {path:"/mesafeli-satis",priority:.2,changeFrequency:"yearly" as const},
  ];

  const dbPostSlugs=new Set((posts||[]).map(post=>post.slug));

  return [
    ...staticRoutes.map(route=>({
      url:base+route.path,
      changeFrequency:route.changeFrequency,
      priority:route.priority,
    })),
    ...(products||[]).map(product=>({
      url:`${base}/urun/${product.slug}`,
      lastModified:product.updated_at?new Date(product.updated_at):undefined,
      changeFrequency:"weekly" as const,
      priority:.85
    })),
    ...(posts||[]).map(post=>({
      url:`${base}/blog/${post.slug}`,
      lastModified:post.updated_at?new Date(post.updated_at):undefined,
      changeFrequency:"monthly" as const,
      priority:.65
    })),
    ...editorialPosts.filter(post=>!dbPostSlugs.has(post.slug)).map(post=>({
      url:`${base}/blog/${post.slug}`,
      lastModified:new Date(post.updated_at),
      changeFrequency:"monthly" as const,
      priority:.65
    }))
  ];
}
