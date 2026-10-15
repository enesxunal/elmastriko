import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set("et_affiliate_code", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return response;
}
