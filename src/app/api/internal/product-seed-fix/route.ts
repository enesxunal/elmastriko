import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { supabase } = await requireAdmin();
    const slugs = [
      "elmas-urun-1",
      "elmas-urun-2",
      "elmas-urun-3",
      "elmas-urun-4",
      "elmas-urun-5",
      "elmas-urun-6",
      "elmas-urun-7",
      "elmas-urun-8",
      "elmas-urun-9",
      "siyah-gold-detayli-triko-takim",
    ];

    const { data: products, error } = await supabase
      .from("products")
      .select("id,slug")
      .in("slug", slugs);
    if (error) throw error;

    const bySlug = new Map((products || []).map((p) => [p.slug, p]));
    const duplicateP1 = bySlug.get("elmas-urun-1");
    const properP1 = bySlug.get("siyah-gold-detayli-triko-takim");

    if (duplicateP1 && properP1) {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", duplicateP1.id);
      if (deleteError) throw deleteError;
    }

    const targetIds = [
      properP1?.id,
      bySlug.get("elmas-urun-2")?.id,
      bySlug.get("elmas-urun-3")?.id,
      bySlug.get("elmas-urun-4")?.id,
      bySlug.get("elmas-urun-5")?.id,
      bySlug.get("elmas-urun-6")?.id,
      bySlug.get("elmas-urun-7")?.id,
      bySlug.get("elmas-urun-8")?.id,
      bySlug.get("elmas-urun-9")?.id,
    ].filter((id): id is string => Boolean(id));

    if (targetIds.length) {
      const { error: imageError } = await supabase
        .from("product_images")
        .delete()
        .in("product_id", targetIds)
        .like("url", "/images/%");
      if (imageError) throw imageError;
    }

    return NextResponse.json({ ok: true, cleaned: targetIds.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 },
    );
  }
}
