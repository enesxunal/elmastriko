import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { basitKargo } from "@/lib/integrations/basitkargo";

const TOKEN_HASH = "3a9d6de62ef894d32029d977456c6b58c8d272f0c7cf594672a992807fae1877";

function validToken(value:string){
  const actual=Buffer.from(createHash("sha256").update(value,"utf8").digest("hex"));
  const expected=Buffer.from(TOKEN_HASH);
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}

export async function POST(request:NextRequest){
  const token=request.headers.get("x-test-token")||"";
  if(!validToken(token)) return NextResponse.json({error:"Unauthorized"},{status:401});

  const supabase=createAdminClient();
  const {data:invoice}=await supabase
    .from("invoices")
    .select("order_id,provider,invoice_no,status,raw_response,created_at")
    .order("created_at",{ascending:false})
    .limit(1)
    .maybeSingle();

  let bk:any=null;
  try{
    const health=await basitKargo.healthCheck();
    bk={
      balance:health.balance,
      brands:Array.isArray(health.brands)?health.brands.map((b:any)=>({id:b.id,name:b.name,status:b.status||null})):[],
      addresses:Array.isArray(health.addresses)?health.addresses.map((a:any)=>({id:a.id,name:a.name,city:a.city||null,town:a.town||null,isDefault:a.isDefault??a.default??null})):[],
      handlers:Array.isArray(health.handlers)?health.handlers.map((h:any)=>({name:h.name,code:h.code})):[],
    };
  }catch(error){
    bk={error:error instanceof Error?error.message:"BasitKargo health failed"};
  }

  return NextResponse.json({invoice,bk});
}
