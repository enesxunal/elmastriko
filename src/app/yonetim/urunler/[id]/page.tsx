import Link from "next/link";
import { ArrowLeft, ExternalLink, ImagePlus, PackageCheck, Save, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import ProductMediaUploadForm from "@/components/ProductMediaUploadForm";
import { createVariant, createVariantMatrix, deleteProduct, deleteProductImage, deleteVariant, updateProduct, updateVariant } from "../../actions";

export default async function ProductAdminDetail({
  params,
  searchParams,
}:{
  params:Promise<{id:string}>;
  searchParams:Promise<{error?:string;created?:string;variants_created?:string}>;
}){
  const {id}=await params;
  const {error,created,variants_created}=await searchParams;
  const {supabase}=await requireAdmin();

  const [{data:product},{data:variants},{data:images},{data:categories},{data:productOptionsRow}] = await Promise.all([
    supabase.from("products").select("id,name,slug,gender,product_type,base_price,compare_at_price,description,category_id,is_active,is_featured").eq("id",id).maybeSingle(),
    supabase.from("product_variants").select("id,sku,color,size,price,is_active,inventory(stock,reserved)").eq("product_id",id).order("created_at"),
    supabase.from("product_images").select("id,url,alt_text,sort_order").eq("product_id",id).order("sort_order"),
    supabase.from("categories").select("id,name").eq("is_active",true).order("sort_order"),
    supabase.from("site_settings").select("value").eq("key","product_options").maybeSingle(),
  ]);
  if(!product) notFound();

  const productOptions=(productOptionsRow?.value||{}) as {colors?:string[];sizes?:string[]};
  const optionColors=Array.isArray(productOptions.colors)&&productOptions.colors.length?productOptions.colors:["Siyah","Beyaz","Ekru","Lacivert","Bordo","Yeşil","Haki","Gri","Vizon","Bej","Mürdüm"];
  const optionSizes=Array.isArray(productOptions.sizes)&&productOptions.sizes.length?productOptions.sizes:["S","M","L","XL","XXL"];

  const totalStock=(variants||[]).reduce((sum,variant)=>{
    const inv=Array.isArray(variant.inventory)?variant.inventory[0]:variant.inventory;
    return sum+Math.max(0,Number(inv?.stock||0)-Number(inv?.reserved||0));
  },0);

  return <main className="admin-page product-admin-page">
    <div className="admin-breadcrumb"><Link href="/yonetim/urunler"><ArrowLeft size={14}/> Ürünlere dön</Link></div>

    <div className="product-detail-titlebar">
      <div>
        <div className="product-detail-kicker">{product.is_active?"YAYINDA":"PASİF"} · /{product.slug}</div>
        <h1>{product.name}</h1>
        <div className="product-detail-summary">
          <span>{variants?.length||0} varyant</span>
          <span>{totalStock} adet kullanılabilir stok</span>
          <span>{images?.length||0} görsel</span>
        </div>
      </div>
      <div className="product-head-actions">
        <Link href={"/urun/"+product.slug} target="_blank" className="admin-secondary-button">Mağazada gör <ExternalLink size={14}/></Link>
      </div>
    </div>

    {created&&<div className="admin-alert success"><PackageCheck size={16}/> Ürün oluşturuldu. Şimdi beden, renk ve stok varyantlarını ekleyebilirsiniz.</div>}
    {variants_created&&<div className="admin-alert success"><PackageCheck size={16}/> {variants_created} varyant otomatik oluşturuldu.</div>}
    {error&&<div className="admin-alert error">{error}</div>}

    <div className="product-editor-detail-grid">
      <div className="product-editor-main">
        <section className="product-editor-card">
          <div className="product-editor-card-head"><div><span>1</span><div><h2>Ürün bilgileri</h2><p>Mağazada görünen temel içerik ve fiyat bilgileri.</p></div></div></div>
          <form action={updateProduct} className="product-detail-form">
            <input type="hidden" name="id" value={id}/>
            <div className="product-field"><label>Ürün adı</label><input name="name" defaultValue={product.name} required/></div>
            <div className="product-field"><label>Açıklama</label><textarea name="description" defaultValue={product.description||""} rows={7} placeholder="Ürünün kumaşı, kalıbı, kullanım ve bakım bilgileri..."/></div>
            <div className="product-two-cols">
              <div className="product-field"><label>Satış fiyatı</label><div className="money-input"><input name="base_price" type="number" min="0" step="0.01" defaultValue={product.base_price??""}/><span>TL</span></div></div>
              <div className="product-field"><label>İndirim öncesi fiyat</label><div className="money-input"><input name="compare_at_price" type="number" min="0" step="0.01" defaultValue={product.compare_at_price??""}/><span>TL</span></div></div>
            </div>
            <div className="product-three-cols">
              <div className="product-field"><label>Koleksiyon</label><select name="gender" defaultValue={product.gender||"kadin"}><option value="kadin">Kadın</option><option value="erkek">Erkek</option><option value="unisex">Unisex</option></select></div>
              <div className="product-field"><label>Kategori</label><select name="category_id" defaultValue={product.category_id||""}><option value="">Kategori seçilmedi</option>{categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="product-field"><label>Ürün tipi</label><input name="product_type" defaultValue={product.product_type||""} placeholder="Kazak, hırka..."/></div>
            </div>
            <div className="product-field"><label>URL kısa adı</label><div className="slug-input"><span>/urun/</span><input name="slug" defaultValue={product.slug} required/></div></div>
            <div className="product-setting-row">
              <label><input type="checkbox" name="is_active" defaultChecked={product.is_active}/><span><strong>Aktif</strong><small>Ürünü mağazada yayınla</small></span></label>
              <label><input type="checkbox" name="is_featured" defaultChecked={product.is_featured}/><span><strong>Öne çıkan</strong><small>Ana sayfa seçkilerinde kullanılabilir</small></span></label>
            </div>
            <div className="product-form-actions"><button className="admin-primary-button" type="submit"><Save size={15}/> Değişiklikleri kaydet</button></div>
          </form>
        </section>

        <section className="product-editor-card">
          <div className="product-editor-card-head"><div><span>2</span><div><h2>Görseller</h2><p>İlk görsel kapak görselidir. Bir seferde en fazla 8 görsel yükleyebilirsiniz.</p></div></div><b>{images?.length||0} görsel</b></div>

          <ProductMediaUploadForm productId={id} productName={product.name} startOrder={(images?.at(-1)?.sort_order??-1)+1}/>

          <div className="product-gallery-admin">
            {images?.map((img,index)=>{
              const url=img.url.startsWith("/images/")&&img.url.endsWith(".png")?img.url.replace(/\.png$/,".webp"):img.url;
              return <article key={img.id}>
                <div className="product-gallery-image"><img src={url} alt={img.alt_text||product.name}/>{index===0&&<span>Kapak</span>}</div>
                <div className="product-gallery-info"><div><strong>{img.alt_text||"Alt metin yok"}</strong><small>Sıra: {img.sort_order}</small></div><form action={deleteProductImage}><input type="hidden" name="product_id" value={id}/><input type="hidden" name="id" value={img.id}/><button className="icon-danger" aria-label="Görseli sil"><Trash2 size={15}/></button></form></div>
              </article>;
            })}
            {!images?.length&&<div className="product-gallery-empty"><ImagePlus size={28}/><strong>Henüz görsel yok</strong><span>Yukarıdan ürün görsellerini sürükleyip bırakabilirsiniz.</span></div>}
          </div>
        </section>

        <section className="product-editor-card">
          <div className="product-editor-card-head"><div><span>3</span><div><h2>Beden, renk & stok</h2><p>Her beden-renk kombinasyonunu ayrı varyant olarak yönetin.</p></div></div><b>{variants?.length||0} varyant</b></div>

          <form action={createVariantMatrix} className="variant-matrix-box">
            <input type="hidden" name="product_id" value={id}/>
            <div className="variant-matrix-head"><div><strong>Hızlı varyant oluştur</strong><span>Renkleri ve bedenleri seç; tüm kombinasyonlar tek seferde oluşsun.</span></div><Link href="/yonetim/ayarlar#product-options">Renk / beden listesini düzenle</Link></div>
            <div className="variant-matrix-group"><label>Renkler</label><div className="variant-option-chips">{optionColors.map(color=><label key={color}><input type="checkbox" name="colors" value={color}/><span>{color}</span></label>)}</div></div>
            <div className="variant-matrix-group"><label>Bedenler</label><div className="variant-option-chips">{optionSizes.map(size=><label key={size}><input type="checkbox" name="sizes" value={size}/><span>{size}</span></label>)}</div></div>
            <div className="variant-matrix-actions"><div className="product-field"><label>Varyant başına başlangıç stoğu</label><input name="stock" type="number" min="0" defaultValue="0"/></div><button className="admin-primary-button" type="submit">Seçili varyantları oluştur</button></div>
          </form>

          <details className="variant-create-box">
            <summary>Tek varyant ekle (gelişmiş)</summary>
            <form action={createVariant} className="variant-create-form">
              <input type="hidden" name="product_id" value={id}/>
              <div className="product-field"><label>SKU</label><input name="sku" placeholder="ELM-001-S-SYH"/></div>
              <div className="product-field"><label>Renk</label><input name="color" placeholder="Siyah"/></div>
              <div className="product-field"><label>Beden</label><input name="size" placeholder="S"/></div>
              <div className="product-field"><label>Fiyat</label><input name="price" type="number" min="0" step="0.01" placeholder="Boşsa ürün fiyatı"/></div>
              <div className="product-field"><label>Stok</label><input name="stock" type="number" min="0" defaultValue="0"/></div>
              <label className="variant-active"><input type="checkbox" name="is_active" defaultChecked/> Aktif</label>
              <button className="admin-primary-button">Varyant ekle</button>
            </form>
          </details>

          <div className="variant-table">
            <div className="variant-table-head"><span>SKU</span><span>Renk</span><span>Beden</span><span>Fiyat</span><span>Stok</span><span>Rezerve</span><span>Durum</span><span/></div>
            {variants?.map(vr=>{
              const inv=Array.isArray(vr.inventory)?vr.inventory[0]:vr.inventory;
              return <article key={vr.id}>
                <form action={updateVariant} className="variant-table-row">
                  <input type="hidden" name="product_id" value={id}/><input type="hidden" name="id" value={vr.id}/>
                  <input name="sku" defaultValue={vr.sku||""} placeholder="SKU"/>
                  <input name="color" defaultValue={vr.color||""} placeholder="Renk"/>
                  <input name="size" defaultValue={vr.size||""} placeholder="Beden"/>
                  <input name="price" type="number" step="0.01" defaultValue={vr.price??""} placeholder="Ürün fiyatı"/>
                  <input name="stock" type="number" min="0" defaultValue={inv?.stock??0}/>
                  <input name="reserved" type="number" min="0" defaultValue={inv?.reserved??0}/>
                  <label className="variant-row-toggle"><input type="checkbox" name="is_active" defaultChecked={vr.is_active}/><span>{vr.is_active?"Aktif":"Pasif"}</span></label>
                  <button className="variant-save" aria-label="Varyantı kaydet"><Save size={14}/></button>
                </form>
                <form action={deleteVariant}><input type="hidden" name="product_id" value={id}/><input type="hidden" name="id" value={vr.id}/><button className="icon-danger" aria-label="Varyantı sil"><Trash2 size={14}/></button></form>
              </article>;
            })}
            {!variants?.length&&<div className="variant-empty">Henüz varyant yok. İlk beden/renk kombinasyonunu yukarıdan ekleyin.</div>}
          </div>
        </section>
      </div>

      <aside className="product-editor-side">
        <section className="product-editor-card sticky product-health-card">
          <div className="product-editor-card-head compact"><div><div><h2>Ürün özeti</h2><p>Yayın öncesi hızlı kontrol.</p></div></div></div>
          <div className="product-health-row"><span>Görsel</span><b className={images?.length?"ok":"warn"}>{images?.length?images.length+" adet":"Eksik"}</b></div>
          <div className="product-health-row"><span>Varyant</span><b className={variants?.length?"ok":"warn"}>{variants?.length?variants.length+" adet":"Eksik"}</b></div>
          <div className="product-health-row"><span>Stok</span><b className={totalStock>0?"ok":"warn"}>{totalStock>0?totalStock+" adet":"Stok yok"}</b></div>
          <div className="product-health-row"><span>Fiyat</span><b className={product.base_price!=null?"ok":"warn"}>{product.base_price!=null?Number(product.base_price).toLocaleString("tr-TR")+" TL":"Eksik"}</b></div>
        </section>

        <section className="product-editor-card danger-zone">
          <h2>Ürünü sil</h2>
          <p>Ürün, görselleri, varyantları ve stok kayıtları katalogdan kaldırılır.</p>
          <form action={deleteProduct}><input type="hidden" name="id" value={id}/><button className="danger-button"><Trash2 size={14}/> Ürünü sil</button></form>
        </section>
      </aside>
    </div>
  </main>;
}
