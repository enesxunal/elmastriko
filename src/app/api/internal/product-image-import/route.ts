import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const body = await request.json() as {
      productId?: string;
      data?: string;
      alt?: string;
      filename?: string;
      replace?: boolean;
    };

    const productId = String(body.productId || "").trim();
    const data = String(body.data || "").trim();
    const alt = String(body.alt || "").trim();
    const filename = String(body.filename || "initial.webp").replace(/[^a-zA-Z0-9._-]/g, "-");

    if (!productId || !data) {
      return NextResponse.json({ ok: false, error: "missing_data" }, { status: 400 });
    }

    const bytes = Buffer.from(data, "base64");
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "invalid_file" }, { status: 400 });
    }

    if (body.replace) {
      const { error: deleteRowsError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);
      if (deleteRowsError) throw deleteRowsError;
    }

    const path = `${productId}/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from("product-media")
      .upload(path, bytes, { contentType: "image/webp", upsert: true });
    if (uploadError) throw uploadError;

    const url = supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: productId,
      url,
      alt_text: alt || "Ürün görseli",
      sort_order: 0,
    });
    if (imageError) throw imageError;

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
