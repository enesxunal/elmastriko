import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  makeProductImageKey,
  removeProductImage,
  signProductImageUpload,
  usesR2Media,
  validateImageMime,
} from "@/lib/media/r2";

export const runtime = "nodejs";

function json(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function hasValidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function adminClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (roleError || profile?.role !== "admin") return null;
  return supabase;
}

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return json({ error: "Kaynak doğrulaması başarısız." }, 403);
  const supabase = await adminClient();
  if (!supabase) return json({ error: "Yönetici girişi gerekli." }, 403);

  let body: { productId?: string; mime?: string; size?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }

  const productId = String(body.productId || "");
  const mime = String(body.mime || "");
  const size = Number(body.size);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
    return json({ error: "Geçersiz ürün kimliği." }, 400);
  }
  try {
    validateImageMime(mime, size);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Geçersiz görsel." }, 400);
  }

  const { data: product, error } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();
  if (error) return json({ error: "Ürün kaydı doğrulanamadı." }, 503);
  if (!product) return json({ error: "Ürün bulunamadı." }, 404);

  if (!usesR2Media()) {
    if (process.env.NODE_ENV === "production") {
      return json({ error: "Görsel yükleme deposu yapılandırılmamış. Cloudflare R2 ayarlarını kontrol edin." }, 503);
    }
    return json({ provider: "supabase" });
  }

  try {
    const key = makeProductImageKey(productId, mime);
    const signed = await signProductImageUpload(key, mime);
    return json({ provider: "r2", ...signed });
  } catch (error) {
    console.error("R2 upload signing failed", error);
    return json({ error: "Görsel servisi hazır değil. Cloudflare R2 bağlantısını kontrol edin." }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasValidOrigin(request)) return json({ error: "Kaynak doğrulaması başarısız." }, 403);
  const supabase = await adminClient();
  if (!supabase) return json({ error: "Yönetici girişi gerekli." }, 403);
  if (!usesR2Media()) return json({ error: "R2 etkin değil." }, 409);

  let body: { productId?: string; key?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  const productId = String(body.productId || "");
  const key = String(body.key || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId) ||
      !key.startsWith("products/" + productId + "/")) {
    return json({ error: "Geçersiz görsel konumu." }, 400);
  }
  try {
    await removeProductImage(key);
    return json({ ok: true });
  } catch (error) {
    console.error("R2 cleanup failed", error);
    return json({ error: "Görsel temizlenemedi." }, 502);
  }
}
