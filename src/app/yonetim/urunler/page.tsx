import Link from "next/link";
import { ImageOff, PackagePlus, Plus, Search, SlidersHorizontal } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createCategory } from "../actions";

type ProductRow = {
  id:string;
  slug:string;
  name:string;
  gender:string|null;
  product_type:string|null;
  base_price:number|null;
  is_active:boolean;
  is_featured:boolean;
  categories:{name:string}|{name:string}[]|null;
  product_images:{url:string;sort_order:number}[]|null;
  product_variants:{id:string;inventory:{stock:number;reserved:number}[]|{stock:number;reserved:number}|null}[]|null;
};

function firstImage(product:ProductRow) {
  const images=[...(product.product_images||[])].sort((a,b)=>a.sort_order-b.sort_order);
  const url=images[0]?.url;
  return url?.startsWith("/images/")&&url.endsWith(".png")?url.replace(/\.png$/,".webp"):url;
}

function stock(product:ProductRow) {
  return (product.product_variants||[]).reduce((total,variant)=>{
    const inv=Array.isArray(variant.inventory)?variant.inventory[0]:variant.inventory;
    return total+Math.max(0,Number(inv?.stock||0)-Number(inv?.reserved||0));
  },0);
}

export default async function ProductsAdmin({searchParams}:{searchParams:Promise<{error?:string;q?:string;status?:string}>}) {
  const { error, q="", status="all" } = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: rawProducts }, { data: categories }] = await Promise.all([
    supabase.from("products").select("id,slug,name,gender,product_type,base_price,is_active,is_featured,categories(name),product_images(url,sort_order),product_variants(id,inventory(stock,reserved))").order("created_at",{ascending:false}),
    supabase.from("categories").select("id,name,slug,sort_order,is_active").order("sort_order"),
  ]);

  const products=(rawProducts||[]) as unknown as ProductRow[];
  const needle=q.trim().toLocaleLowerCase("tr-TR");
  const filtered=products.filter(product=>{
    const matchesText=!needle||[product.name,product.slug,product.product_type,product.gender].some(value=>String(value||"").toLocaleLowerCase("tr-TR").includes(needle));
    const matchesStatus=status==="all"||(status==="active"?product.is_active:!product.is_active);
    return matchesText&&matchesStatus;
  });
  const missingImages=products.filter(product=>!(product.product_images||[]).length).length;
  const active=products.filter(product=>product.is_active).length;

  return <main className="admin-page product-admin-page">
    <div className="admin-page-head product-page-head">
      <div><span>KATALOG</span><h1>Ürünler</h1></div>
      <div className="product-head-actions">
        <details className="product-category-popover">
          <summary><SlidersHorizontal size={15}/> Kategoriler</summary>
          <div>
            <div className="product-category-list">{categories?.map(c=><span key={c.id}>{c.name}<small>/{c.slug}</small></span>)}</div>
            <form action={createCategory} className="product-category-form">
              <input name="name" placeholder="Kategori adı" required/>
              <input name="slug" placeholder="kategori-url" required/>
              <input name="sort_order" type="hidden" value="0"/>
              <input name="is_active" type="hidden" value="on"/>
              <button>Ekle</button>
            </form>
          </div>
        </details>
        <Link href="/yonetim/urunler/yeni" className="admin-primary-button"><Plus size={15}/> Yeni ürün</Link>
      </div>
    </div>
    {error&&<div className="admin-alert error">{error}</div>}

    <section className="product-list-stats">
      <div><span>Toplam ürün</span><strong>{products.length}</strong></div>
      <div><span>Aktif</span><strong>{active}</strong></div>
      <div><span>Pasif</span><strong>{products.length-active}</strong></div>
      <div><span>Görselsiz</span><strong>{missingImages}</strong></div>
    </section>

    <form className="product-list-toolbar" method="get">
      <label><Search size={16}/><input name="q" defaultValue={q} placeholder="Ürün adı, tip veya URL ara..."/></label>
      <select name="status" defaultValue={status}><option value="all">Tüm durumlar</option><option value="active">Aktif ürünler</option><option value="draft">Pasif ürünler</option></select>
      <button>Ara</button>
      {(q||status!=="all")&&<Link href="/yonetim/urunler">Temizle</Link>}
    </form>

    <section className="product-table-card">
      <div className="product-table-head"><span>Ürün</span><span>Kategori</span><span>Fiyat</span><span>Stok</span><span>Durum</span><span/></div>
      {filtered.length ? filtered.map(product=>{
        const image=firstImage(product);
        const category=Array.isArray(product.categories)?product.categories[0]:product.categories;
        const available=stock(product);
        return <Link href={"/yonetim/urunler/"+product.id} className="product-table-row" key={product.id}>
          <div className="product-list-identity">
            <div className="product-list-thumb">{image?<img src={image} alt=""/>:<ImageOff size={18}/>}</div>
            <div><strong>{product.name}</strong><small>{product.product_type||"Ürün tipi yok"} · /{product.slug}</small></div>
          </div>
          <span>{category?.name||"Kategorisiz"}</span>
          <strong>{product.base_price==null?"—":Number(product.base_price).toLocaleString("tr-TR")+" TL"}</strong>
          <span className={available<=5?"stock-low":""}>{available} adet</span>
          <span><b className={product.is_active?"status-badge active":"status-badge"}>{product.is_active?"Yayında":"Pasif"}</b>{product.is_featured&&<small className="featured-note">Öne çıkan</small>}</span>
          <b className="row-arrow">→</b>
        </Link>;
      }) : <div className="product-list-empty"><PackagePlus size={28}/><strong>Ürün bulunamadı</strong><span>Arama kriterlerini değiştirin veya yeni ürün ekleyin.</span><Link href="/yonetim/urunler/yeni">Yeni ürün ekle</Link></div>}
    </section>
  </main>;
}
