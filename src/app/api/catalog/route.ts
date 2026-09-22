import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog-db";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("slugs") || "";
  const slugs = raw.split(",").map(x => x.trim()).filter(Boolean);

  const products = await getProducts();
  const data = slugs.length ? products.filter(product => slugs.includes(product.slug)) : products;

  return NextResponse.json({ products: data }, {
    headers: { "Cache-Control": "no-store" },
  });
}
