import type { Metadata } from "next";
import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { editorialPosts } from "@/lib/editorial-content";

const siteUrl = "https://www.elmastriko.com";

export const metadata: Metadata = {
  title: "Elmas Journal: Triko Bakımı, Stil ve Kombin Rehberi",
  description: "Triko bakımı, kadın ve erkek triko kombin önerileri, sezon seçkileri ve Elmas Triko koleksiyonlarından ilham veren içerikler.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: dbPosts } = await supabase.from("blog_posts").select("slug,title,excerpt,cover_image,published_at").eq("status","published").order("published_at",{ascending:false});
  const dbSlugs=new Set((dbPosts||[]).map(post=>post.slug));
  const posts=[
    ...(dbPosts||[]),
    ...editorialPosts.filter(post=>!dbSlugs.has(post.slug)).map(post=>({
      slug:post.slug,
      title:post.title,
      excerpt:post.excerpt,
      cover_image:post.cover_image,
      published_at:post.published_at,
    }))
  ].sort((a,b)=>new Date(b.published_at||0).getTime()-new Date(a.published_at||0).getTime());

  const blogSchema={
    "@context":"https://schema.org",
    "@type":"Blog",
    "@id":`${siteUrl}/blog#blog`,
    url:`${siteUrl}/blog`,
    name:"Elmas Journal",
    description:"Triko bakımı, stil, kombin ve ürün seçim rehberleri.",
    publisher:{"@id":`${siteUrl}/#organization`},
    inLanguage:"tr-TR",
    blogPost:posts.map(post=>({
      "@type":"BlogPosting",
      headline:post.title,
      url:`${siteUrl}/blog/${post.slug}`,
      datePublished:post.published_at||undefined,
      image:post.cover_image?(post.cover_image.startsWith("http")?post.cover_image:siteUrl+post.cover_image):undefined
    }))
  };
  const breadcrumbSchema={
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    itemListElement:[
      {"@type":"ListItem",position:1,name:"Ana Sayfa",item:siteUrl},
      {"@type":"ListItem",position:2,name:"Elmas Journal",item:`${siteUrl}/blog`}
    ]
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(blogSchema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbSchema)}}/><StoreHeader/><main className="blog-page">
    <section className="content-hero">
      <span>ELMAS JOURNAL</span>
      <h1>Triko bakımı, stil ve kombin rehberi.</h1>
      <p>Koleksiyonlardan ilham, triko bakım rehberleri ve sezon seçkileri.</p>
    </section>
    <section className="blog-grid">
      {posts.map(post=><Link className="blog-card" href={"/blog/"+post.slug} key={post.slug}>
        {post.cover_image?<img src={post.cover_image} alt={post.title}/>:<div className="blog-placeholder">ELMAS</div>}
        <span>{post.published_at?new Date(post.published_at).toLocaleDateString("tr-TR"):""}</span>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        <b>Devamını oku →</b>
      </Link>)}
    </section>
  </main><StoreFooter/></>;
}
