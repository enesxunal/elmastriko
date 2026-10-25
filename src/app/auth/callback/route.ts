import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/hesabim";
  try {
    const target = new URL(value, "https://www.elmastriko.com");
    return target.origin === "https://www.elmastriko.com" ? target.pathname + target.search : "/hesabim";
  } catch {
    return "/hesabim";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    const cancelled = url.searchParams.get("error") === "access_denied";
    const message = cancelled ? "Google ile giriş iptal edildi. E-posta ile devam edebilirsiniz." : "Doğrulama bağlantısı geçersiz veya süresi dolmuş.";
    return NextResponse.redirect(new URL("/hesabim?error=" + encodeURIComponent(message), "https://www.elmastriko.com"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/hesabim?error=" + encodeURIComponent("Doğrulama tamamlanamadı. Yeni bir bağlantı isteyin."), "https://www.elmastriko.com"));
  }

  return NextResponse.redirect(new URL(next, "https://www.elmastriko.com"));
}
