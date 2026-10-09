import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(req: NextRequest) {
  const order=(req.nextUrl.searchParams.get("order")||"").trim();
  if (!order || order.length>100) return NextResponse.json({paid:false},{status:400});
  const {data,error}=await createAdminClient().from("orders").select("payment_status").eq("order_no",order).maybeSingle();
  return NextResponse.json({paid:!error && data?.payment_status==="paid"},{headers:{"Cache-Control":"no-store"}});
}
