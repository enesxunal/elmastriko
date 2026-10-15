import {NextRequest,NextResponse} from "next/server";
import {createPublicClient} from "@/lib/supabase/public";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const kinds=new Set(["page_view","engagement","view_item","add_to_cart","begin_checkout"]);
const response=(status:number)=>new NextResponse(null,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:NextRequest){
  const origin=request.headers.get("origin"),site=request.headers.get("sec-fetch-site");
  // Next may normalize localhost in nextUrl; retain the actual incoming Host.
  const host=request.headers.get("host");
  const sameOrigin=!origin||origin===request.nextUrl.origin||Boolean(host&&origin===request.nextUrl.protocol+"//"+host);
  if(!sameOrigin||(site&&site!=="same-origin"&&site!=="none"))return response(403);
  if(!request.headers.get("content-type")?.startsWith("application/json"))return response(415);
  if(/bot|crawler|spider|slurp/i.test(request.headers.get("user-agent")||""))return response(204);
  if(Number(request.headers.get("content-length")||0)>16000)return response(413);
  try{
    const reader=request.body?.getReader();if(!reader)return response(400);
    const chunks:Uint8Array[]=[];let length=0;
    while(true){const{done,value}=await reader.read();if(done)break;length+=value.length;if(length>16000){await reader.cancel();return response(413);}chunks.push(value);}
    const joined=new Uint8Array(length);let offset=0;for(const c of chunks){joined.set(c,offset);offset+=c.length;}
    const body=JSON.parse(new TextDecoder().decode(joined));
    if(!body||typeof body.sessionId!=="string"||!UUID.test(body.sessionId)||typeof body.visitorId!=="string"||!UUID.test(body.visitorId)||!Array.isArray(body.events)||!body.events.length||body.events.length>20)return response(400);
    const events=[];
    for(const event of body.events){
      if(!event||!UUID.test(event.id||"")||!UUID.test(event.pageId||"")||!kinds.has(event.kind)||typeof event.path!=="string"||!event.path.startsWith("/")||event.path.startsWith("//")||event.path.length>500||/[?#]/.test(event.path)||/^\/(yonetim|api|auth|influencer)(\/|$)/.test(event.path)||!Number.isFinite(Date.parse(event.at)))return response(400);
      const ms=event.activeMs??0;if(!Number.isSafeInteger(ms)||ms<0||ms>20000)return response(400);
      events.push({id:event.id,pageId:event.pageId,kind:event.kind,path:event.path,at:event.at,activeMs:event.kind==="engagement"?ms:0,
        ...(typeof event.slug==="string"&&/^[a-zA-Z0-9_-]{1,160}$/.test(event.slug)?{slug:event.slug}:{})});
    }
    const metadata:Record<string,string|number|null>={};
    for(const [key,max] of Object.entries({source:80,medium:80,campaign:160,referrerHost:255,device:40,browser:80,os:80})){
      const value=body.metadata?.[key];metadata[key]=typeof value==="string"&&!value.includes("@")?value.slice(0,max):null;
    }
    const width=Number(body.metadata?.width||0);metadata.width=Number.isSafeInteger(width)?Math.max(0,Math.min(width,10000)):0;
    const {data,error}=await createPublicClient().rpc("ingest_store_analytics",{payload:{sessionId:body.sessionId,visitorId:body.visitorId,metadata,events}});
    if(error){console.error("Analytics collection unavailable",error.code);return response(503);}
    return response(data?204:400);
  }catch{return response(400);}
}
