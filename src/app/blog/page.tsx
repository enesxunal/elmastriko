import type { Metadata } from "next";
import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { editorialPosts } from "@/lib/editorial-content";

const siteUrl = "https://www.elmastriko.com";

export const metadata: Metadata = {
  title: "Triko Rehberi: Kombin, Bakım ve 2026 Trendleri",
  description: "Kadın ve erkek triko kombinleri, hırka stil önerileri, kazak yıkama ve bakım rehberleri ile 2026 sonbahar-kış triko trendleri.",
  alternates: { canonical: "/blog" },
};

function categoryFor(slug:string){
  const editorial=editorialPosts.find(post=>post.slug===slug);
  return editorial?.category || "Elmas Journal";
}

function readingTimeFor(slug:string){
  const editorial=editorialPosts.find(post=>post.slug===slug);
  return editorial?.reading_time || 5;
}

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

  const featured=posts[0];
  const categories=["Tümü","Kadın Stil","Erkek Stil","Bakım","Trendler","Rehber"];

  const blogSchema={
    "@context":"https://schema.org",
    "@type":"Blog",
    "@id":`${siteUrl}/blog#blog`,
    url:`${siteUrl}/blog`,
    name:"Elmas Journal",
    description:"Triko bakımı, stil, kombin ve sezon trendleri üzerine uzmanlaşmış içerik merkezi.",
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

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(blogSchema)}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbSchema)}}/>
    <StoreHeader/>
    <main className="blog-page seo-blog-page">
      <section className="content-hero blog-hero">
        <span>ELMAS JOURNAL</span>
        <h1>Triko hakkında aradığınız her şey.</h1>
        <p>Kombin fikirlerinden bakım rehberlerine, sezon trendlerinden doğru ürün seçimine kadar triko gardırobunuzu daha iyi kullanmanıza yardımcı olan içerikler.</p>
        <div className="blog-topic-links">
          {categories.slice(1).map(category=><span key={category}>{category}</span>)}
        </div>
      </section>

      {featured&&<section className="blog-featured">
        <Link href={"/blog/"+featured.slug} className="blog-featured-image">
          {featured.cover_image?<img src={featured.cover_image} alt={featured.title}/>:<div className="blog-placeholder">ELMAS</div>}
        </Link>
        <div className="blog-featured-copy">
          <span>{categoryFor(featured.slug)} · {readingTimeFor(featured.slug)} dk okuma</span>
          <h2><Link href={"/blog/"+featured.slug}>{featured.title}</Link></h2>
          <p>{featured.excerpt}</p>
          <Link className="blog-read-link" href={"/blog/"+featured.slug}>Rehberi oku →</Link>
        </div>
      </section>}

      <section className="blog-cluster-intro">
        <div><span>01</span><h2>Kombin</h2><p>Kadın ve erkek triko parçalarını günlük, ofis ve hafta sonu görünümlerine uyarlayın.</p></div>
        <div><span>02</span><h2>Bakım</h2><p>Yıkama, kurutma, saklama ve tüylenme konusunda ürün ömrünü destekleyen pratik bilgiler.</p></div>
        <div><span>03</span><h2>Trend</h2><p>Sezon eğilimlerini gardırobunuza uygulanabilir ve tekrar kullanılabilir şekilde taşıyın.</p></div>
      </section>

      <section className="blog-grid seo-blog-grid">
        {posts.slice(1).map(post=><Link className="blog-card seo-blog-card" href={"/blog/"+post.slug} key={post.slug}>
          {post.cover_image?<img src={post.cover_image} alt={post.title}/>:<div className="blog-placeholder">ELMAS</div>}
          <div className="blog-card-meta"><span>{categoryFor(post.slug)}</span><span>{readingTimeFor(post.slug)} dk</span></div>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <b>Devamını oku →</b>
        </Link>)}
      </section>

      <section className="blog-seo-copy">
        <span>TRİKO REHBERİ</span>
        <h2>Doğru parçayı seçmek, kombinlemek ve uzun süre kullanmak için.</h2>
        <p>Elmas Journal; kadın triko kazak, hırka, triko takım ve erkek triko kombinleri için ilham verirken bakım rehberleriyle ürünlerin doğru kullanılmasına yardımcı olur. İçeriklerimiz yalnızca trendleri değil, gerçek kullanım sorularını da yanıtlayacak şekilde hazırlanır.</p>
        <div>
          <Link href="/kadin">Kadın triko koleksiyonu</Link>
          <Link href="/yeni-gelenler">Yeni gelenler</Link>
          <Link href="/kadin/hirka">Kadın hırka modelleri</Link>
          <Link href="/kadin/kazak">Kadın kazak modelleri</Link>
        </div>
      </section>
    </main>
    <StoreFooter/>
  </>;
}
