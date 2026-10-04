import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { getEditorialPost } from "@/lib/editorial-content";

const siteUrl="https://www.elmastriko.com";

async function getPost(slug:string){
  const supabase=await createClient();
  const {data}=await supabase.from("blog_posts").select("slug,title,excerpt,content,cover_image,seo_title,seo_description,published_at,updated_at").eq("slug",slug).eq("status","published").maybeSingle();
  return data || getEditorialPost(slug);
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const p=await getPost(slug);
  if(!p)return{};
  return{
    title:p.seo_title||p.title,
    description:p.seo_description||p.excerpt||undefined,
    alternates:{canonical:`/blog/${p.slug}`},
    openGraph:{
      title:p.seo_title||p.title,
      description:p.seo_description||p.excerpt||undefined,
      images:p.cover_image?[p.cover_image]:undefined,
      type:"article",
      url:`${siteUrl}/blog/${p.slug}`,
    }
  };
}

export default async function BlogDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const post=await getPost(slug);
  if(!post)notFound();

  const articleSchema={
    "@context":"https://schema.org",
    "@type":"Article",
    headline:post.title,
    description:post.seo_description||post.excerpt||undefined,
    image:post.cover_image?[post.cover_image.startsWith("http")?post.cover_image:siteUrl+post.cover_image]:undefined,
    datePublished:post.published_at||undefined,
    dateModified:post.updated_at||post.published_at||undefined,
    mainEntityOfPage:`${siteUrl}/blog/${post.slug}`,
    author:{"@type":"Organization","name":"Elmas Triko"},
    publisher:{"@type":"Organization","name":"Elmas Triko","logo":{"@type":"ImageObject","url":`${siteUrl}/elmas-triko.png`}}
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(articleSchema)}}/>
    <StoreHeader/>
    <main className="article-page">
      <header>
        <span>ELMAS JOURNAL</span>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <small>{post.published_at?new Date(post.published_at).toLocaleDateString("tr-TR"):""}</small>
      </header>
      {post.cover_image&&<img className="article-cover" src={post.cover_image} alt={post.title}/>}
      <article>{post.content.split(/\n\n+/).map((paragraph:string,i:number)=><p key={i}>{paragraph}</p>)}</article>
      <nav className="article-related-links" aria-label="İlgili koleksiyonlar">
        <Link href="/kadin">Kadın triko koleksiyonu</Link>
        <Link href="/yeni-gelenler">Yeni gelenler</Link>
        <Link href="/blog">Tüm rehberler</Link>
      </nav>
    </main>
    <StoreFooter/>
  </>;
}
