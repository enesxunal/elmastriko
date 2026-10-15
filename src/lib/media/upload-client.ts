import type { createClient } from "@/lib/supabase/client";

type BrowserSupabase = ReturnType<typeof createClient>;

export type UploadedProductMedia = {
  url: string;
  provider: "r2" | "supabase";
  key: string;
};

async function responseMessage(response: Response) {
  try {
    const payload: { error?: string } = await response.json();
    return payload.error || "Görsel aktarımı başarısız oldu.";
  } catch {
    return "Görsel aktarımı başarısız oldu.";
  }
}

export async function uploadProductImage(
  supabase: BrowserSupabase,
  productId: string,
  file: File,
): Promise<UploadedProductMedia> {
  if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type)) {
    throw new Error("JPEG, PNG, WebP veya AVIF görseli yükleyin.");
  }
  if (!file.size || file.size > 8 * 1024 * 1024) {
    throw new Error("Her görsel en fazla 8 MB olabilir.");
  }

  const signResponse = await fetch("/api/yonetim/media", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, mime: file.type, size: file.size }),
  });
  if (!signResponse.ok) throw new Error(await responseMessage(signResponse));

  const signed = await signResponse.json() as
    | { provider: "supabase" }
    | { provider: "r2"; key: string; publicUrl: string; uploadUrl: string; headers: Record<string,string> };

  if (signed.provider === "r2") {
    const uploaded = await fetch(signed.uploadUrl, {
      method: "PUT",
      body: file,
      headers: signed.headers,
    });
    if (!uploaded.ok) throw new Error("Cloudflare R2 görsel yüklemesi başarısız: HTTP " + uploaded.status);
    return { provider: "r2", key: signed.key, url: signed.publicUrl };
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const key = productId + "/" + Date.now() + "-" + crypto.randomUUID() + "." + extension;
  const { error } = await supabase.storage.from("product-media").upload(key, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return {
    provider: "supabase",
    key,
    url: supabase.storage.from("product-media").getPublicUrl(key).data.publicUrl,
  };
}

export async function cleanupUploadedProductImages(
  supabase: BrowserSupabase,
  productId: string,
  media: UploadedProductMedia[],
) {
  const legacyKeys = media.filter(x => x.provider === "supabase").map(x => x.key);
  if (legacyKeys.length) {
    const { error } = await supabase.storage.from("product-media").remove(legacyKeys);
    if (error) console.error("Legacy media cleanup failed", error);
  }

  for (const entry of media.filter(x => x.provider === "r2")) {
    try {
      const response = await fetch("/api/yonetim/media", {
        method: "DELETE",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, key: entry.key }),
      });
      if (!response.ok) console.error("R2 media cleanup failed", await responseMessage(response));
    } catch (error) {
      console.error("R2 media cleanup request failed", error);
    }
  }
}
