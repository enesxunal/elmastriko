import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, profile: null, address: null }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const [{ data: profile }, { data: address }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("addresses")
      .select("title,full_name,phone,city,district,postal_code,address_line,is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    user: { email: user.email || "" },
    profile: profile || null,
    address: address || null,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
