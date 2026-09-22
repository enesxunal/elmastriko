import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createPost, togglePostStatus } from "../actions";

export default async function BlogAdmin(){
  const {supabase}=await requireAdmin();
  const {data:posts}=await supabase.from("blog_posts").select("id,slug,title,status,published_at,updated_at").order("created_at",{ascending:false});
  return <main className="admin-page">
    <div className="admin-page-head"><div><span>İÇERİK</span><h1>Blog</h1></div><p>SEO içerikleri, taslaklar ve yayın durumu.</p></div>
    <details className="admin-create"><summary>+ Yeni blog yazısı</summary><form action={createPost} className="admin-form-grid"><input name="title" placeholder="Başlık" required/><input name="slug" placeholder="yazi-slug" required/><input name="excerpt" placeholder="Kısa açıklama"/><input name="cover_image" placeholder="Kapak görsel URL"/><input name="seo_title" placeholder="SEO başlık"/><input name="seo_description" placeholder="SEO açıklama"/><textarea className="full" name="content" placeholder="İçerik" required/><select name="status"><option value="draft">Taslak</option><option value="published">Yayınla</option></select><button>Kaydet</button></form></details>
    <div className="admin-table">{posts?.map(p=><div className="admin-row" key={p.id}><div><Link href={"/yonetim/blog/"+p.id}><b>{p.title}</b></Link><small>/blog/{p.slug}</small></div><span>{p.status}</span><span>{p.published_at?new Date(p.published_at).toLocaleDateString("tr-TR"):"—"}</span><form action={togglePostStatus}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="status" value={p.status==="published"?"draft":"published"}/><button>{p.status==="published"?"Taslağa al":"Yayınla"}</button></form></div>)}</div>
  </main>;
}
