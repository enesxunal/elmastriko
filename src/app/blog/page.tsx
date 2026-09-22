import type { Metadata } from "next";
import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Blog | Elmas Triko",
  description: "Triko bakımı, kombin önerileri, sezon seçkileri ve Elmas Triko koleksiyonlarından ilham veren içerikler.",
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase.from("blog_posts").select("slug,title,excerpt,cover_image,published_at").eq("status","published").order("published_at",{ascending:false});
  return <><StoreHeader/><main className="blog-page"><section className="content-hero"><span>ELMAS JOURNAL</span><h1>Triko, stil ve bakım notları.</h1><p>Koleksiyonlardan ilham, triko bakım rehberleri ve sezon seçkileri.</p></section>{posts?.length?<section className="blog-grid">{posts.map(post=><Link className="blog-card" href={"/blog/"+post.slug} key={post.slug}>{post.cover_image?<img src={post.cover_image} alt={post.title}/>:<div className="blog-placeholder">ELMAS</div>}<span>{post.published_at?new Date(post.published_at).toLocaleDateString("tr-TR"):""}</span><h2>{post.title}</h2><p>{post.excerpt}</p><b>Devamını oku →</b></Link>)}</section>:<section className="empty-collection"><span>JOURNAL</span><h2>İlk yazılar hazırlanıyor.</h2><p>Triko bakımı ve sezon seçkileri yakında burada yayınlanacak.</p></section>}</main><StoreFooter/></>;
}
