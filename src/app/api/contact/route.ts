import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req:NextRequest){
  let body:{name?:string;email?:string;phone?:string;subject?:string;message?:string;website?:string};
  try{body=await req.json();}catch{return NextResponse.json({error:"Geçersiz istek."},{status:400});}
  if(body.website)return NextResponse.json({ok:true});
  const name=(body.name||"").trim(), email=(body.email||"").trim().toLowerCase(), message=(body.message||"").trim();
  if(name.length<2||name.length>120||email.length>254||message.length<5||message.length>5000)return NextResponse.json({error:"Zorunlu alanları kontrol edin."},{status:400});
  const supabase=await createClient();
  const {error}=await supabase.rpc("submit_contact_message",{
    p_name:name,p_email:email,p_phone:(body.phone||"").trim(),p_subject:(body.subject||"").trim(),p_message:message
  });
  if(error){
    const status=error.message.includes("rate_limited")?429:400;
    return NextResponse.json({error:status===429?"Lütfen birkaç dakika sonra tekrar deneyin.":"Mesaj gönderilemedi."},{status});
  }
  return NextResponse.json({ok:true});
}
