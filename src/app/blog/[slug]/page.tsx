import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { createClient } from "@/lib/supabase/server";

async function getPost(slug:string){const supabase=await createClient();const {data}=await supabase.from("blog_posts").select("slug,title,excerpt,content,cover_image,seo_title,seo_description,published_at").eq("slug",slug).eq("status","published").maybeSingle();return data;}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const p=await getPost(slug);if(!p)return{};return{title:p.seo_title||p.title,description:p.seo_description||p.excerpt||undefined,openGraph:{title:p.seo_title||p.title,description:p.seo_description||p.excerpt||undefined,images:p.cover_image?[p.cover_image]:undefined,type:"article"}}}
export default async function BlogDetail({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const post=await getPost(slug);if(!post)notFound();return <><StoreHeader/><main className="article-page"><header><span>ELMAS JOURNAL</span><h1>{post.title}</h1><p>{post.excerpt}</p><small>{post.published_at?new Date(post.published_at).toLocaleDateString("tr-TR"):""}</small></header>{post.cover_image&&<img className="article-cover" src={post.cover_image} alt={post.title}/>}<article>{post.content.split(/\n\n+/).map((p:string,i:number)=><p key={i}>{p}</p>)}</article></main><StoreFooter/></>}
