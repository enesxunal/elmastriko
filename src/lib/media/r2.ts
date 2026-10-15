import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const R2_IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function usesR2Media() {
  // After migration the production store has an R2 bucket; never fall back to the
  // missing legacy Supabase bucket just because the feature flag is unset/stale.
  return process.env.MEDIA_STORAGE_PROVIDER?.trim().toLowerCase() === "r2" ||
    (process.env.NODE_ENV === "production" &&
      Boolean(process.env.R2_BUCKET_NAME && process.env.R2_PUBLIC_BASE_URL));
}

function config() {
  const account = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");

  if (!account || !accessKeyId || !secretAccessKey || !bucket || !base) {
    throw new Error("Cloudflare R2 yapılandırması eksik. Görsel yükleme devre dışı.");
  }
  const parsed = new URL(base);
  if (parsed.protocol !== "https:" || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error("R2_PUBLIC_BASE_URL geçerli bir HTTPS adresi olmalı.");
  }
  if (process.env.NODE_ENV === "production" && parsed.hostname.endsWith(".r2.dev")) {
    throw new Error("Üretimde R2 için Cloudflare özel alan adı kullanın; r2.dev uygun değildir.");
  }

  return {
    bucket,
    base,
    client: new S3Client({
      region: "auto",
      endpoint: "https://" + account + ".r2.cloudflarestorage.com",
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
    }),
  };
}

export function validateImageMime(type: string, size: number) {
  if (!Object.hasOwn(PRODUCT_IMAGE_MIME_EXTENSIONS, type)) {
    throw new Error("JPEG, PNG, WebP veya AVIF görseli yükleyin.");
  }
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("Her görsel en fazla 8 MB olabilir.");
  }
}

export function makeProductImageKey(productId: string, type: string) {
  const ext = PRODUCT_IMAGE_MIME_EXTENSIONS[type];
  if (!ext) throw new Error("Desteklenmeyen görsel türü.");
  if (!/^[a-f\d-]{36}$/i.test(productId)) throw new Error("Geçersiz ürün kimliği.");
  return "products/" + productId + "/" + Date.now() + "-" + crypto.randomUUID() + "." + ext;
}

export function publicUrlForKey(key: string) {
  const { base } = config();
  return base + "/" + key.split("/").map(encodeURIComponent).join("/");
}

export function objectKeyFromPublicUrl(url: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (!base) return null;
  try {
    const candidate = new URL(url);
    const configured = new URL(base);
    const prefix = configured.pathname.replace(/\/+$/, "") + "/products/";
    if (candidate.origin !== configured.origin || !candidate.pathname.startsWith(prefix)) return null;
    if (candidate.search || candidate.hash) return null;
    const suffix = candidate.pathname.slice(configured.pathname.replace(/\/+$/, "").length + 1);
    if (!/^products\/[a-f\d-]{36}\/[A-Za-z0-9._/-]+$/i.test(suffix) || suffix.includes("..")) return null;
    return decodeURIComponent(suffix);
  } catch {
    return null;
  }
}

export async function signProductImageUpload(key: string, mime: string) {
  const { client, bucket } = config();
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mime,
      CacheControl: R2_IMAGE_CACHE_CONTROL,
    }),
    { expiresIn: 300 },
  );
  return {
    uploadUrl,
    publicUrl: publicUrlForKey(key),
    key,
    headers: { "Content-Type": mime, "Cache-Control": R2_IMAGE_CACHE_CONTROL },
  };
}

export async function putProductImage(key: string, data: Uint8Array, mime: string) {
  const { client, bucket } = config();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: mime,
    CacheControl: R2_IMAGE_CACHE_CONTROL,
  }));
  return publicUrlForKey(key);
}

export async function removeProductImage(key: string) {
  if (!/^products\/[a-f\d-]{36}\/[A-Za-z0-9._/-]+$/i.test(key) || key.includes("..")) {
    throw new Error("Geçersiz görsel dosyası.");
  }
  const { client, bucket } = config();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
