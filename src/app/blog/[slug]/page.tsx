import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";
import { editorialPosts, getEditorialPost, type EditorialPost } from "@/lib/editorial-content";

const siteUrl="https://www.elmastriko.com";

async function getPost(slug:string){
  const supabase=await createClient();
  const {data}=await supabase.from("blog_posts").select("slug,title,excerpt,content,cover_image,seo_title,seo_description,published_at,updated_at").eq("slug",slug).eq("status","published").maybeSingle();
  return data || getEditorialPost(slug);
}

function renderArticleContent(content:string){
  const lines=content.split("\n").map(line=>line.trim());
  const nodes:React.ReactNode[]=[];
  let bullets:string[]=[];

  const flushBullets=()=>{
    if(!bullets.length)return;
    nodes.push(<ul key={`list-${nodes.length}`}>{bullets.map((item,index)=><li key={index}>{item}</li>)}</ul>);
    bullets=[];
  };

  lines.forEach((line,index)=>{
    if(!line){flushBullets();return;}
    if(line.startsWith("- ")){bullets.push(line.slice(2));return;}
    flushBullets();
    if(line.startsWith("## "))nodes.push(<h2 key={index}>{line.slice(3)}</h2>);
    else if(line.startsWith("### "))nodes.push(<h3 key={index}>{line.slice(4)}</h3>);
    else nodes.push(<p key={index}>{line}</p>);
  });
  flushBullets();
  return nodes;
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

  const editorial=editorialPosts.find(item=>item.slug===post.slug) as EditorialPost|undefined;
  const faq=editorial?.faq||[];
  const category=editorial?.category||"Elmas Journal";
  const readingTime=editorial?.reading_time||Math.max(4,Math.ceil((post.content||"").split(/\s+/).length/180));

  const articleSchema={
    "@context":"https://schema.org",
    "@type":"BlogPosting",
    "@id":`${siteUrl}/blog/${post.slug}#article`,
    headline:post.title,
    description:post.seo_description||post.excerpt||undefined,
    image:post.cover_image?[post.cover_image.startsWith("http")?post.cover_image:siteUrl+post.cover_image]:undefined,
    datePublished:post.published_at||undefined,
    dateModified:post.updated_at||post.published_at||undefined,
    mainEntityOfPage:{"@type":"WebPage","@id":`${siteUrl}/blog/${post.slug}`},
    author:{"@id":`${siteUrl}/#organization`},
    publisher:{"@id":`${siteUrl}/#organization`},
    isPartOf:{"@id":`${siteUrl}/#website`},
    articleSection:category,
    about:[
      {"@type":"Thing","name":"Triko"},
      {"@type":"Brand","name":"Elmas Triko"}
    ],
    inLanguage:"tr-TR"
  };

  const breadcrumbSchema={
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    itemListElement:[
      {"@type":"ListItem",position:1,name:"Ana Sayfa",item:siteUrl},
      {"@type":"ListItem",position:2,name:"Elmas Journal",item:`${siteUrl}/blog`},
      {"@type":"ListItem",position:3,name:post.title,item:`${siteUrl}/blog/${post.slug}`}
    ]
  };

  const faqSchema=faq.length?{
    "@context":"https://schema.org",
    "@type":"FAQPage",
    mainEntity:faq.map(item=>({
      "@type":"Question",
      name:item.question,
      acceptedAnswer:{"@type":"Answer",text:item.answer}
    }))
  }:null;

  const related=editorialPosts.filter(item=>item.slug!==post.slug && (item.category===category || category==="Elmas Journal")).slice(0,3);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(articleSchema)}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbSchema)}}/>
    {faqSchema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema)}}/>}
    <StoreHeader/>
    <main className="article-page seo-article-page">
      <header className="article-hero">
        <Link href="/blog" className="article-back">← Elmas Journal</Link>
        <div className="article-meta"><span>{category}</span><span>{readingTime} dk okuma</span><span>{post.published_at?new Date(post.published_at).toLocaleDateString("tr-TR"):""}</span></div>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
      </header>

      {post.cover_image&&<div className="article-cover-wrap"><img className="article-cover" src={post.cover_image} alt={post.title}/></div>}

      <div className="article-layout">
        <aside className="article-aside">
          <span>İLGİLİ KOLEKSİYONLAR</span>
          <Link href="/kadin">Kadın triko</Link>
          <Link href="/kadin/hirka">Hırka modelleri</Link>
          <Link href="/kadin/kazak">Kazak modelleri</Link>
          <Link href="/yeni-gelenler">Yeni gelenler</Link>
        </aside>
        <article className="article-body">{renderArticleContent(post.content)}</article>
      </div>

      {faq.length>0&&<section className="article-faq">
        <span>SIK SORULAN SORULAR</span>
        <h2>Bu konuda en çok merak edilenler</h2>
        <div>{faq.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
      </section>}

      <section className="article-shop-cta">
        <span>ELMAS TRİKO</span>
        <h2>Rehberden koleksiyona geçin.</h2>
        <p>Kombin ve bakım rehberlerindeki önerileri güncel Elmas Triko koleksiyonuyla eşleştirin.</p>
        <div><Link href="/kadin">Kadın koleksiyonunu keşfet</Link><Link href="/yeni-gelenler">Yeni gelenleri gör</Link></div>
      </section>

      {related.length>0&&<section className="article-related">
        <div className="article-related-head"><span>DEVAMINI OKU</span><h2>İlgili rehberler</h2></div>
        <div className="article-related-grid">{related.map(item=><Link href={"/blog/"+item.slug} key={item.slug}><span>{item.category} · {item.reading_time} dk</span><h3>{item.title}</h3><p>{item.excerpt}</p><b>Oku →</b></Link>)}</div>
      </section>}
    </main>
    <StoreFooter/>
  </>;
}
