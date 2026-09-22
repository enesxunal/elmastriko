import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createCategory, createProduct, deleteProduct, updateProduct } from "../actions";

export default async function ProductsAdmin({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("id,slug,name,gender,product_type,base_price,compare_at_price,is_active,is_featured,description").order("created_at",{ascending:false}),
    supabase.from("categories").select("id,name,slug,sort_order,is_active").order("sort_order"),
  ]);

  return <main className="admin-page">
    <div className="admin-page-head"><div><span>KATALOG</span><h1>Ürün Yönetimi</h1></div><p>Ürün, varyant, stok, görsel, fiyat ve kategori yönetimi.</p></div>
    {error&&<div className="admin-alert error">{error}</div>}

    <section className="admin-section">
      <div className="admin-section-head"><h2>Kategoriler</h2><span>{categories?.length||0} kategori</span></div>
      <div className="admin-category-row">{categories?.map(c=><span key={c.id}>{c.name} <small>/{c.slug}</small></span>)}</div>
      <details className="admin-create"><summary>+ Kategori ekle</summary><form action={createCategory} className="admin-form-grid compact"><input name="name" placeholder="Kategori adı" required/><input name="slug" placeholder="kategori-slug" required/><input name="sort_order" type="number" defaultValue="0"/><label><input type="checkbox" name="is_active" defaultChecked/> Aktif</label><button>Kaydet</button></form></details>
    </section>

    <details className="admin-create"><summary>+ Yeni ürün ekle</summary><form action={createProduct} className="admin-form-grid"><input name="name" placeholder="Ürün adı" required/><input name="slug" placeholder="urun-slug" required/><select name="gender"><option value="kadin">Kadın</option><option value="erkek">Erkek</option><option value="unisex">Unisex</option></select><input name="product_type" placeholder="Ürün tipi"/><input name="base_price" type="number" step="0.01" placeholder="Fiyat"/><input name="compare_at_price" type="number" step="0.01" placeholder="Eski fiyat"/><textarea name="description" placeholder="Açıklama"/><label><input type="checkbox" name="is_active" defaultChecked/> Aktif</label><label><input type="checkbox" name="is_featured"/> Öne çıkan</label><button>Ürünü Kaydet</button></form></details>

    <section className="admin-card-list">{products?.map(p=><article className="admin-product-card" key={p.id}>
      <form action={updateProduct}>
        <input type="hidden" name="id" value={p.id}/>
        <div className="admin-product-title"><div><span>{p.slug}</span><input name="name" defaultValue={p.name}/></div><div className="admin-product-meta"><b>{p.base_price==null?"Fiyat yok":Number(p.base_price).toLocaleString("tr-TR")+" TL"}</b><Link href={"/yonetim/urunler/"+p.id}>Varyant / stok / görsel →</Link></div></div>
        <div className="admin-inline-fields"><input name="product_type" defaultValue={p.product_type||""} placeholder="Tip"/><input name="base_price" type="number" step="0.01" defaultValue={p.base_price??""} placeholder="Fiyat"/><input name="compare_at_price" type="number" step="0.01" defaultValue={p.compare_at_price??""} placeholder="Eski fiyat"/></div>
        <textarea name="description" defaultValue={p.description||""}/>
        <div className="admin-actions"><label><input type="checkbox" name="is_active" defaultChecked={p.is_active}/> Aktif</label><label><input type="checkbox" name="is_featured" defaultChecked={p.is_featured}/> Öne çıkan</label><button>Güncelle</button></div>
      </form>
      <form action={deleteProduct}><input type="hidden" name="id" value={p.id}/><button className="danger">Sil</button></form>
    </article>)}</section>
  </main>;
}
