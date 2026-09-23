import Link from "next/link";
import { PackageSearch, Search, Save } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { updateInventoryOnly } from "../actions";

type InventoryRow = {
  stock: number;
  reserved: number;
  updated_at: string | null;
  product_variants: {
    id: string;
    sku: string | null;
    color: string | null;
    size: string | null;
    is_active: boolean;
    products: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  } | {
    id: string;
    sku: string | null;
    color: string | null;
    size: string | null;
    is_active: boolean;
    products: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  }[] | null;
};

export default async function StockAdmin({ searchParams }:{ searchParams:Promise<{q?:string;filter?:string;error?:string}> }) {
  const {q="",filter="all",error}=await searchParams;
  const {supabase}=await requireAdmin();

  const {data:rawRows}=await supabase
    .from("inventory")
    .select("stock,reserved,updated_at,product_variants(id,sku,color,size,is_active,products(id,name,slug))")
    .order("stock",{ascending:true});

  const rows=(rawRows||[]) as unknown as InventoryRow[];
  const needle=q.trim().toLocaleLowerCase("tr-TR");

  const prepared=rows.map(row=>{
    const variant=Array.isArray(row.product_variants)?row.product_variants[0]:row.product_variants;
    const productRaw=variant?.products;
    const product=Array.isArray(productRaw)?productRaw[0]:productRaw;
    const available=Math.max(0,Number(row.stock||0)-Number(row.reserved||0));
    return {row,variant,product,available};
  }).filter(item=>{
    if(!item.variant||!item.product) return false;
    const text=[item.product.name,item.variant.sku,item.variant.color,item.variant.size].join(" ").toLocaleLowerCase("tr-TR");
    const matchesText=!needle||text.includes(needle);
    const matchesFilter=filter==="all"||
      (filter==="low"&&item.available>0&&item.available<=5)||
      (filter==="out"&&item.available===0)||
      (filter==="active"&&item.variant.is_active);
    return matchesText&&matchesFilter;
  });

  const total=prepared.reduce((sum,item)=>sum+Number(item.row.stock||0),0);
  const availableTotal=prepared.reduce((sum,item)=>sum+item.available,0);
  const low=prepared.filter(item=>item.available>0&&item.available<=5).length;
  const out=prepared.filter(item=>item.available===0).length;

  return <main className="admin-page">
    <div className="admin-page-head">
      <div><span>ENVANTER</span><h1>Stok Yönetimi</h1></div>
      <p>Tüm ürün varyantlarının fiziksel, rezerve ve satışa uygun stoklarını tek ekrandan takip edin.</p>
    </div>
    {error&&<div className="admin-alert error">{error}</div>}

    <section className="product-list-stats stock-kpis">
      <div><span>Toplam fiziksel stok</span><strong>{total}</strong></div>
      <div><span>Satılabilir stok</span><strong>{availableTotal}</strong></div>
      <div><span>Düşük stok varyantı</span><strong>{low}</strong></div>
      <div><span>Stokta yok</span><strong>{out}</strong></div>
    </section>

    <form className="product-list-toolbar" method="get">
      <label><Search size={16}/><input name="q" defaultValue={q} placeholder="Ürün, SKU, renk veya beden ara..."/></label>
      <select name="filter" defaultValue={filter}>
        <option value="all">Tüm stoklar</option>
        <option value="low">Düşük stok</option>
        <option value="out">Stokta yok</option>
        <option value="active">Aktif varyantlar</option>
      </select>
      <button>Ara</button>
      {(q||filter!=="all")&&<Link href="/yonetim/stok">Temizle</Link>}
    </form>

    <section className="inventory-admin-card">
      <div className="inventory-admin-head">
        <span>Ürün / SKU</span><span>Renk</span><span>Beden</span><span>Fiziksel</span><span>Rezerve</span><span>Satılabilir</span><span/>
      </div>
      {prepared.length?prepared.map(({row,variant,product,available})=><form action={updateInventoryOnly} className="inventory-admin-row" key={variant!.id}>
        <input type="hidden" name="variant_id" value={variant!.id}/>
        <div><Link href={"/yonetim/urunler/"+product!.id}><strong>{product!.name}</strong></Link><small>{variant!.sku||"SKU yok"}</small></div>
        <span>{variant!.color||"Standart"}</span>
        <span>{variant!.size||"Standart"}</span>
        <input name="stock" type="number" min="0" defaultValue={row.stock}/>
        <input name="reserved" type="number" min="0" defaultValue={row.reserved}/>
        <b className={available===0?"stock-zero":available<=5?"stock-low":"stock-ok"}>{available}</b>
        <button className="variant-save" aria-label="Stoku kaydet"><Save size={14}/></button>
      </form>):<div className="product-list-empty"><PackageSearch size={28}/><strong>Stok kaydı bulunamadı</strong><span>Ürün varyantları eklendiğinde burada görünecek.</span></div>}
    </section>
  </main>;
}
