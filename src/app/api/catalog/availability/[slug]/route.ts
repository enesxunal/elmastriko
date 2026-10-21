import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("product_variants(id,is_active,inventory(stock,reserved))")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Stok bilgisi güncellenemedi." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!data) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const variants = (data.product_variants || []) as unknown as Array<{
    id: string;
    is_active: boolean;
    inventory: { stock: number; reserved: number }[] | { stock: number; reserved: number } | null;
  }>;
  return NextResponse.json({
    variants: variants.filter(variant => variant.is_active).map(variant => {
      const inv = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
      return { id: variant.id, available: Math.max(0, Number(inv?.stock || 0) - Number(inv?.reserved || 0)) };
    }),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
