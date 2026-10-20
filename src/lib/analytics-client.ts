"use client";
import {analyticsAllowed,currentAnalyticsSession,type AnalyticsSession} from "./analytics-identity";
export {analyticsAllowed} from "./analytics-identity";

type Kind="page_view"|"engagement"|"view_item"|"add_to_cart"|"begin_checkout";
export type AnalyticsPage={id:string;viewItemId?:string;checkoutId?:string;path:string;session:AnalyticsSession};
type Event={id:string;pageId:string;kind:Kind;path:string;at:string;activeMs:number;slug?:string};
type Queued={session:AnalyticsSession;event:Event};
let page:AnalyticsPage|null=null;
let queue:Queued[]=[];
let scheduled:ReturnType<typeof setTimeout>|undefined;
let inFlight:Promise<void>|null=null;
let retries=0;
function schedule(){if(!scheduled)scheduled=setTimeout(()=>{scheduled=undefined;void flushAnalytics();},400);}
export function enqueueAnalytics(target:AnalyticsPage,kind:Kind,activeMs=0,slug?:string){
  const event:Event={id:kind==="page_view"?target.id:kind==="view_item"?target.viewItemId!:kind==="begin_checkout"?target.checkoutId!:crypto.randomUUID(),pageId:target.id,kind,path:target.path,at:new Date().toISOString(),activeMs};
  if(slug)event.slug=slug.slice(0,160);
  queue.push({session:target.session,event});if(queue.length>100)queue=queue.slice(-100);schedule();return event.id;
}
export function currentAnalyticsPage(path=location.pathname):AnalyticsPage{
  const s=currentAnalyticsSession();
  const clean=path.split("?")[0].replace(/^(\/hesabim\/siparis)\/[^/]+/,"$1/[siparis]").slice(0,500);
  if(!page||page.path!==clean||page.session.id!==s.id){
    page={id:crypto.randomUUID(),viewItemId:crypto.randomUUID(),path:clean,session:s};enqueueAnalytics(page,"page_view");
    if(/^\/urun\/[^/]+$/.test(clean))enqueueAnalytics(page,"view_item",0,clean.split("/").pop());
  }
  return page;
}
export function trackStoreEvent(kind:"add_to_cart"|"begin_checkout",slug?:string){
  try{if(analyticsAllowed()){const target=currentAnalyticsPage();if(kind==="begin_checkout"){if(target.checkoutId)return target.checkoutId;target.checkoutId=crypto.randomUUID();}return enqueueAnalytics(target,kind,0,slug);}}catch{/* Measurement must never block shopping. */}
}
export function analyticsOrderContext(){
  try{if(analyticsAllowed()){const p=currentAnalyticsPage();return{sessionId:p.session.id,visitorId:p.session.visitorId};}}catch{}
  return undefined;
}
function takeBatch(){
  const first=queue[0];if(!first)return null;
  const items:Queued[]=[];
  while(queue.length&&items.length<20&&queue[0].session.id===first.session.id)items.push(queue.shift()!);
  return{items,payload:{sessionId:first.session.id,visitorId:first.session.visitorId,metadata:first.session.metadata,events:items.map(i=>i.event)}};
}
export async function flushAnalytics(beacon=false):Promise<void>{
  if(typeof window==="undefined")return;
  if(scheduled){clearTimeout(scheduled);scheduled=undefined;}
  if(beacon){let batch;while((batch=takeBatch())){
    const body=JSON.stringify(batch.payload);let accepted=false;
    try{accepted=navigator.sendBeacon("/api/analytics/events",new Blob([body],{type:"application/json"}));}catch{}
    if(!accepted)void fetch("/api/analytics/events",{method:"POST",body,headers:{"Content-Type":"application/json"},keepalive:true}).catch(()=>undefined);
  }return;}
  if(inFlight)return inFlight;
  inFlight=(async()=>{let batch;while((batch=takeBatch())){try{
    const response=await fetch("/api/analytics/events",{method:"POST",body:JSON.stringify(batch.payload),headers:{"Content-Type":"application/json"},keepalive:true,signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error("analytics_unavailable");retries=0;
  }catch{if(retries++<2){queue.unshift(...batch.items);scheduled=setTimeout(()=>{scheduled=undefined;void flushAnalytics();},2000);}break;}}})().finally(()=>{inFlight=null;});
  return inFlight;
}
