import { getProducts } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.elmastriko.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function money(value: number) {
  return `${value.toFixed(2)} TRY`;
}

export async function GET() {
  const products = await getProducts();
  const items: string[] = [];

  for (const product of products) {
    if (product.price === null) continue;

    const productUrl = `${BASE_URL}/urun/${encodeURIComponent(product.slug)}`;
    const defaultImage = absoluteUrl(product.image);
    const variants = (product.variants || []).filter(variant => variant.price !== null || product.price !== null);

    if (variants.length) {
      for (const variant of variants) {
        const variantPrice = variant.price ?? product.price;
        if (variantPrice === null) continue;

        const color = variant.color || product.colors[0] || undefined;
        const size = variant.size || undefined;
        const colorImage =
          color && product.media?.find(media => media.color === color)?.url
            ? absoluteUrl(product.media.find(media => media.color === color)!.url)
            : defaultImage;
        const id = variant.sku || variant.id;
        const availability = variant.available > 0 ? "in_stock" : "out_of_stock";

        items.push(`
    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:item_group_id>${escapeXml(product.slug)}</g:item_group_id>
      <title>${escapeXml(product.name)}</title>
      <description>${escapeXml(product.description)}</description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${escapeXml(colorImage)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${money(variantPrice)}</g:price>
      <g:condition>new</g:condition>
      <g:brand>Elmas Triko</g:brand>
      <g:gender>${product.category === "erkek" ? "male" : "female"}</g:gender>
      <g:age_group>adult</g:age_group>
      ${color ? `<g:color>${escapeXml(color)}</g:color>` : ""}
      ${size ? `<g:size>${escapeXml(size)}</g:size>` : ""}
    </item>`);
      }
      continue;
    }

    items.push(`
    <item>
      <g:id>${escapeXml(product.slug)}</g:id>
      <title>${escapeXml(product.name)}</title>
      <description>${escapeXml(product.description)}</description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${escapeXml(defaultImage)}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${money(product.price)}</g:price>
      <g:condition>new</g:condition>
      <g:brand>Elmas Triko</g:brand>
      <g:gender>${product.category === "erkek" ? "male" : "female"}</g:gender>
      <g:age_group>adult</g:age_group>
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Elmas Triko Ürün Feed</title>
    <link>${BASE_URL}</link>
    <description>Elmas Triko Google Merchant Center ürün akışı</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
