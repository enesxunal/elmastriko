import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { deletePost, updatePost } from "../../actions";

export default async function BlogEdit({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{error?:string}>}){
  const {id}=await params;const {error}=await searchParams;const {supabase}=await requireAdmin();
  const {data:p}=await supabase.from("blog_posts").select("id,slug,title,excerpt,content,cover_image,seo_title,seo_description,status,published_at").eq("id",id).maybeSingle();
  if(!p)notFound();
  return <main className="admin-page"><div className="admin-breadcrumb"><Link href="/yonetim/blog">← Blog</Link></div><div className="admin-page-head"><div><span>İÇERİK DÜZENLE</span><h1>{p.title}</h1></div></div>{error&&<div className="admin-alert error">{error}</div>}
    <form action={updatePost} className="admin-editor"><input type="hidden" name="id" value={p.id}/><label>Başlık<input name="title" defaultValue={p.title} required/></label><label>Slug<input name="slug" defaultValue={p.slug} required/></label><label>Kısa açıklama<textarea name="excerpt" defaultValue={p.excerpt||""}/></label><label>İçerik<textarea className="editor-content" name="content" defaultValue={p.content} required/></label><div className="admin-form-grid compact"><input name="cover_image" defaultValue={p.cover_image||""} placeholder="Kapak görseli"/><input name="seo_title" defaultValue={p.seo_title||""} placeholder="SEO başlık"/><input name="seo_description" defaultValue={p.seo_description||""} placeholder="SEO açıklama"/><select name="status" defaultValue={p.status}><option value="draft">Taslak</option><option value="published">Yayında</option></select></div><button>Yazıyı Güncelle</button></form>
    <form action={deletePost} className="admin-delete-zone"><input type="hidden" name="id" value={p.id}/><button className="danger">Yazıyı Sil</button></form>
  </main>;
}
