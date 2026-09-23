"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, Loader2 } from "lucide-react";
import ProductImagePicker from "./ProductImagePicker";
import { createClient } from "@/lib/supabase/client";

type Category = { id:string; name:string };

function slugify(value:string) {
  return value.toLocaleLowerCase("tr-TR")
    .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}

export default function ProductCreateForm({categories}:{categories:Category[]}) {
  const router=useRouter();
  const [name,setName]=useState("");
  const [slug,setSlug]=useState("");
  const [slugTouched,setSlugTouched]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy) return;
    setBusy(true);
    setError("");

    const form=event.currentTarget;
    const fd=new FormData(form);
    const supabase=createClient();
    const productName=String(fd.get("name")||"").trim();
    const productSlug=String(fd.get("slug")||"").trim();
    const numberOrNull=(key:string)=>{
      const raw=String(fd.get(key)||"").trim();
      return raw?Number(raw):null;
    };

    const {data:product,error:productError}=await supabase.from("products").insert({
      name:productName,
      slug:productSlug,
      description:String(fd.get("description")||"").trim()||null,
      category_id:String(fd.get("category_id")||"").trim()||null,
      gender:String(fd.get("gender")||"kadin"),
      product_type:String(fd.get("product_type")||"").trim()||null,
      base_price:numberOrNull("base_price"),
      compare_at_price:numberOrNull("compare_at_price"),
      currency:"TRY",
      is_active:fd.get("is_active")==="on",
      is_featured:fd.get("is_featured")==="on",
    }).select("id").single();

    if(productError||!product){
      setError(productError?.message||"Ürün oluşturulamadı.");
      setBusy(false);
      return;
    }

    const files=fd.getAll("images").filter((item):item is File=>item instanceof File&&item.size>0).slice(0,8);
    const uploadedPaths:string[]=[];
    try {
      for(const [index,file] of files.entries()){
        if(file.size>8*1024*1024) throw new Error("Her görsel en fazla 8 MB olabilir.");
        const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
        const path=`${product.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from("product-media").upload(path,file,{contentType:file.type,upsert:false});
        if(uploadError) throw uploadError;
        uploadedPaths.push(path);
        const url=supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
        const {error:imageError}=await supabase.from("product_images").insert({product_id:product.id,url,alt_text:productName,sort_order:index});
        if(imageError) throw imageError;
      }
      await supabase.from("audit_logs").insert({action:"create",entity_type:"product",entity_id:product.id,metadata:{slug:productSlug,source:"admin_product_editor"}});
      router.push(`/yonetim/urunler/${product.id}?created=1`);
      router.refresh();
    } catch(uploadError) {
      if(uploadedPaths.length) await supabase.storage.from("product-media").remove(uploadedPaths);
      await supabase.from("products").delete().eq("id",product.id);
      setError(uploadError instanceof Error?uploadError.message:"Görseller yüklenemedi.");
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="product-editor">
    <div className="product-editor-main">
      {error&&<div className="admin-alert error">{error}</div>}
      <section className="product-editor-card">
        <div className="product-editor-card-head"><div><span>1</span><div><h2>Temel bilgiler</h2><p>Müşterinin mağazada göreceği ürün bilgileri.</p></div></div></div>
        <div className="product-field">
          <label htmlFor="product-name">Ürün adı *</label>
          <input id="product-name" name="name" value={name} onChange={e=>{setName(e.target.value);if(!slugTouched)setSlug(slugify(e.target.value));}} placeholder="Örn. Siyah Çizgili Triko Takım" required autoFocus/>
        </div>
        <div className="product-field">
          <label htmlFor="product-description">Ürün açıklaması</label>
          <textarea id="product-description" name="description" placeholder="Kumaş, kalıp, kullanım ve bakım bilgilerini müşterinin anlayacağı şekilde yazın." rows={7}/>
        </div>
      </section>

      <section className="product-editor-card">
        <div className="product-editor-card-head"><div><span>2</span><div><h2>Görseller</h2><p>İlk görsel ürünün kapak görseli olur. Yükleme doğrudan medya alanına yapılır.</p></div></div></div>
        <ProductImagePicker/>
      </section>

      <section className="product-editor-card">
        <div className="product-editor-card-head"><div><span>3</span><div><h2>Fiyat</h2><p>Varyanta özel fiyat girilmezse ürün fiyatı kullanılır.</p></div></div></div>
        <div className="product-two-cols">
          <div className="product-field"><label htmlFor="base-price">Satış fiyatı</label><div className="money-input"><input id="base-price" name="base_price" type="number" min="0" step="0.01" placeholder="0,00"/><span>TL</span></div></div>
          <div className="product-field"><label htmlFor="compare-price">İndirim öncesi fiyat</label><div className="money-input"><input id="compare-price" name="compare_at_price" type="number" min="0" step="0.01" placeholder="0,00"/><span>TL</span></div></div>
        </div>
      </section>
    </div>

    <aside className="product-editor-side">
      <section className="product-editor-card sticky">
        <div className="product-editor-card-head compact"><div><div><h2>Yayınlama</h2><p>Ürünün mağazadaki durumunu belirleyin.</p></div></div></div>
        <label className="product-switch-row"><div><strong>Aktif</strong><small>Ürün mağazada listelenir.</small></div><input type="checkbox" name="is_active" defaultChecked/></label>
        <label className="product-switch-row"><div><strong>Öne çıkan</strong><small>Ana sayfa seçkilerinde kullanılabilir.</small></div><input type="checkbox" name="is_featured"/></label>
      </section>

      <section className="product-editor-card">
        <div className="product-editor-card-head compact"><div><div><h2>Organizasyon</h2><p>Kategori ve ürün tipi.</p></div></div></div>
        <div className="product-field"><label htmlFor="gender">Koleksiyon *</label><select id="gender" name="gender" defaultValue="kadin"><option value="kadin">Kadın</option><option value="erkek">Erkek</option><option value="unisex">Unisex</option></select></div>
        <div className="product-field"><label htmlFor="category">Kategori</label><select id="category" name="category_id" defaultValue=""><option value="">Kategori seçilmedi</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="product-field"><label htmlFor="product-type">Ürün tipi</label><input id="product-type" name="product_type" placeholder="Kazak, hırka, takım..."/></div>
      </section>

      <section className="product-editor-card">
        <div className="product-editor-card-head compact"><div><div><h2>Arama bağlantısı</h2><p>URL otomatik hazırlanır; gerekirse düzenleyin.</p></div></div></div>
        <div className="product-field"><label htmlFor="product-slug">URL kısa adı *</label><div className="slug-input"><span>/urun/</span><input id="product-slug" name="slug" value={slug} onChange={e=>{setSlugTouched(true);setSlug(slugify(e.target.value));}} required placeholder="urun-adi"/></div></div>
        <div className="product-tip"><Info size={15}/><span>Kaydettiğiniz anda ürün ekranı açılır; beden, renk, SKU ve stok varyantlarını oradan ekleyebilirsiniz.</span></div>
      </section>

      <button className="product-save-primary" type="submit" disabled={busy}>{busy?<><Loader2 size={16} className="spin"/> Kaydediliyor...</>:<>Ürünü kaydet ve devam et <ArrowRight size={16}/></>}</button>
    </aside>
  </form>;
}
