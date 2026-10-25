import { NextResponse } from "next/server";
import { isGoogleAuthEnabled } from "@/lib/google-auth-provider";

export async function GET() {
  const google = await isGoogleAuthEnabled();
  return NextResponse.json({ google }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
