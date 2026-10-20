"use client";

const TIMEOUT=30*60*1000;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type AnalyticsSession={id:string;visitorId:string;seen:number;metadata:Record<string,string|number|null>};
let session:AnalyticsSession|null=null;
let visitor="";
export function readStorage(store:"localStorage"|"sessionStorage",key:string){try{return window[store].getItem(key);}catch{return null;}}
export function writeStorage(store:"localStorage"|"sessionStorage",key:string,value:string){try{window[store].setItem(key,value);}catch{}}
export function analyticsAllowed(path=typeof location!=="undefined"?location.pathname:""){
  if(typeof window==="undefined"||!path.startsWith("/")||/^\/(yonetim|api|auth|influencer)(\/|$)/.test(path))return false;
  if(!["www.elmastriko.com","elmastriko.com"].includes(location.hostname))return false;
  if(navigator.webdriver||/bot|crawler|spider|slurp/i.test(navigator.userAgent))return false;
  if(navigator.doNotTrack==="1"||(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl)return false;
  return readStorage("localStorage","et_analytics_opt_out")!=="1";
}
function metadata(){
  const ua=navigator.userAgent,query=new URLSearchParams(location.search);
  const safe=(s:string|null,n:number)=>s&&!s.includes("@")?s.slice(0,n):null;
  let host="";try{host=new URL(document.referrer).hostname.replace(/^www\./,"");}catch{}
  if(host===location.hostname.replace(/^www\./,""))host="";
  const organic=/(^|\.)(google|bing|yandex|yahoo|duckduckgo)\./.test(host);
  const social=/(^|\.)(instagram|facebook|tiktok|twitter|pinterest|x)\.com$/.test(host);
  return {source:safe(query.get("utm_source"),80)||(organic?"Organik Arama":social?"Sosyal Medya":host?"Referans":"Direct"),
    medium:safe(query.get("utm_medium"),80)||(organic?"organic":social?"social":null),campaign:safe(query.get("utm_campaign"),160),referrerHost:host||null,
    device:/iPad|Tablet/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?"Tablet":/Mobi|Android|iPhone|iPod/.test(ua)?"Mobil":"Masaüstü",
    browser:/Instagram/.test(ua)?"Instagram":/Edg\//.test(ua)?"Edge":/Chrome|CriOS/.test(ua)?"Chrome":/Firefox|FxiOS/.test(ua)?"Firefox":/Safari/.test(ua)?"Safari":"Diğer",
    os:/iPhone|iPad|iPod/.test(ua)?"iOS":/Android/.test(ua)?"Android":/Mac/.test(ua)?"macOS":/Windows/.test(ua)?"Windows":"Diğer",width:innerWidth};
}
export function currentAnalyticsSession(){
  const now=Date.now();
  if(!visitor){const stored=readStorage("localStorage","et_visitor_id");visitor=stored&&UUID.test(stored)?stored:crypto.randomUUID();writeStorage("localStorage","et_visitor_id",visitor);}
  if(!session){const id=readStorage("sessionStorage","et_session_id"),seen=Number(readStorage("sessionStorage","et_session_last_seen")||0);
    if(id&&UUID.test(id)&&seen&&now-seen<TIMEOUT)session={id,visitorId:visitor,seen,metadata:metadata()};}
  if(!session||now-session.seen>=TIMEOUT){session={id:crypto.randomUUID(),visitorId:visitor,seen:now,metadata:metadata()};writeStorage("sessionStorage","et_session_id",session.id);}
  touchSession(session);return session;
}
export function touchSession(s:AnalyticsSession){s.seen=Date.now();writeStorage("sessionStorage","et_session_last_seen",String(s.seen));}
