import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { basitKargo } from "@/lib/integrations/basitkargo";

const TOKEN_HASH = "766a92f0f8c97a8279bf31fa49d5d1011f088ba832f94549b8c3a623a5824427";

function validToken(value:string){
  const actual=Buffer.from(createHash("sha256").update(value,"utf8").digest("hex"));
  const expected=Buffer.from(TOKEN_HASH);
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}

export async function POST(request:NextRequest){
  const token=request.headers.get("x-test-token")||"";
  if(!validToken(token)) return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const result=await basitKargo.healthCheck();
    return NextResponse.json({
      ok:true,
      handlers:Array.isArray(result.handlers)?result.handlers.map(h=>({name:h.name,code:h.code})):[],
      balance:result.balance,
      brands:Array.isArray(result.brands)?result.brands.map(b=>({id:b.id,name:b.name,status:b.status||null})):[],
      addresses:Array.isArray(result.addresses)?result.addresses.map(a=>({id:a.id,name:a.name,city:a.city||null,town:a.town||null})):[]
    });
  }catch(error){
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:"BasitKargo health failed"},{status:502});
  }
}
