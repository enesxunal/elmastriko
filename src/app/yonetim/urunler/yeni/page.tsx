import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import ProductCreateForm from "@/components/ProductCreateForm";

export default async function NewProductPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: productOptionsRow }] = await Promise.all([
    supabase.from("categories").select("id,name").eq("is_active",true).order("sort_order"),
    supabase.from("site_settings").select("value").eq("key","product_options").maybeSingle(),
  ]);

  const productOptions=(productOptionsRow?.value||{}) as {colors?:string[];sizes?:string[]};
  const colors=Array.isArray(productOptions.colors)&&productOptions.colors.length?productOptions.colors:["Siyah","Beyaz","Ekru","Lacivert","Bordo","Yeşil","Haki","Gri","Vizon","Bej","Mürdüm"];
  const sizes=Array.isArray(productOptions.sizes)&&productOptions.sizes.length?productOptions.sizes:["S","M","L","XL","XXL"];

  return <main className="admin-page product-admin-page">
    <div className="admin-breadcrumb"><Link href="/yonetim/urunler"><ArrowLeft size={14}/> Ürünlere dön</Link></div>
    <div className="admin-page-head product-page-head">
      <div><span>KATALOG</span><h1>Yeni ürün</h1></div>
      <p>Kategori, alt kategori, ürün bilgileri, varyasyonlar, stok ve görselleri tek akışta tamamlayın.</p>
    </div>
    {error && <div className="admin-alert error">{error}</div>}
    <ProductCreateForm categories={categories||[]} colors={colors} sizes={sizes}/>
  </main>;
}
