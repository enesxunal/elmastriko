import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import ProductCreateForm from "@/components/ProductCreateForm";

export default async function NewProductPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id,name").eq("is_active",true).order("sort_order");

  return <main className="admin-page product-admin-page">
    <div className="admin-breadcrumb"><Link href="/yonetim/urunler"><ArrowLeft size={14}/> Ürünlere dön</Link></div>
    <div className="admin-page-head product-page-head">
      <div><span>KATALOG</span><h1>Yeni ürün</h1></div>
      <p>Ürünü temel bilgiler, görseller ve fiyatla oluşturun. Beden, renk, SKU ve stokları sonraki ekranda yönetin.</p>
    </div>
    {error && <div className="admin-alert error">{error}</div>}
    <ProductCreateForm categories={categories||[]}/>
  </main>;
}
