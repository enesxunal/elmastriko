import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req:NextRequest){
  let body:{email?:string};
  try{body=await req.json();}catch{return NextResponse.json({error:"Geçersiz istek."},{status:400});}
  const email=(body.email||"").trim().toLowerCase();
  if(!email || email.length>254)return NextResponse.json({error:"Geçerli bir e-posta girin."},{status:400});
  const supabase=await createClient();
  const {error}=await supabase.rpc("subscribe_newsletter",{p_email:email});
  if(error)return NextResponse.json({error:"Kayıt şu anda tamamlanamadı."},{status:400});
  return NextResponse.json({ok:true});
}
