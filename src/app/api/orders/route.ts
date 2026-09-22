import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OrderPayload = {
  email: string;
  phone?: string;
  shipping: {
    fullName: string;
    city: string;
    district: string;
    postalCode?: string;
    addressLine: string;
  };
  billing?: {
    fullName?: string;
    companyName?: string;
    taxOffice?: string;
    taxNumber?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    addressLine?: string;
  };
  items: Array<{ slug: string; qty: number; size?: string; color?: string }>;
};

export async function POST(request: NextRequest) {
  let payload: OrderPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!payload.email || !payload.shipping?.fullName || !payload.shipping?.city || !payload.shipping?.district || !payload.shipping?.addressLine || !payload.items?.length) {
    return NextResponse.json({ error: "Sipariş bilgileri eksik." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_store_order", { payload });

  if (error) {
    const status = error.message.includes("price_missing") ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data, { status: 201 });
}
