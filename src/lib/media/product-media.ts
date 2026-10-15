import type { createClient } from "@/lib/supabase/server";
import {
  makeProductImageKey,
  objectKeyFromPublicUrl,
  putProductImage,
  removeProductImage,
  usesR2Media,
  validateImageMime,
} from "./r2";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;
const LEGACY_MEDIA_MARKER = "/storage/v1/object/public/product-media/";

function legacyStoragePathFromUrl(url: string) {
  const expectedHost = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!expectedHost) return null;
  try {
    const origin = new URL(expectedHost).origin;
    const candidate = new URL(url);
    if (candidate.origin !== origin || !candidate.pathname.startsWith(LEGACY_MEDIA_MARKER)) return null;
    const path = decodeURIComponent(candidate.pathname.slice(LEGACY_MEDIA_MARKER.length));
    if (!path || path.startsWith("/") || path.includes("..")) return null;
    return path;
  } catch {
    return null;
  }
}

export async function uploadProductMediaServer(supabase: ServerSupabase, productId: string, file: File) {
  validateImageMime(file.type, file.size);
  if (usesR2Media()) {
    const key = makeProductImageKey(productId, file.type);
    const buffer = new Uint8Array(await file.arrayBuffer());
    return putProductImage(key, buffer, file.type);
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const key = productId + "/" + Date.now() + "-" + crypto.randomUUID() + "." + ext;
  const { error } = await supabase.storage.from("product-media").upload(key, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("product-media").getPublicUrl(key).data.publicUrl;
}

export async function removeProductMediaServer(supabase: ServerSupabase, url: string) {
  const r2Key = objectKeyFromPublicUrl(url);
  if (r2Key) {
    await removeProductImage(r2Key);
    return;
  }
  const legacyKey = legacyStoragePathFromUrl(url);
  if (legacyKey) {
    const { error } = await supabase.storage.from("product-media").remove([legacyKey]);
    if (error) throw error;
  }
}
