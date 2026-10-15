export const ANALYTICS_TIME_ZONE="Europe/Istanbul";
const DAY=86400000;
const HOUR=3600000;
export const RANGE_OPTIONS=[
  ["today","Bugün"],["yesterday","Dün"],["1h","Son 1 saat"],["24h","Son 24 saat"],
  ["7","7 gün"],["30","30 gün"],["90","90 gün"],["365","1 yıl"],["all","Tümü"],
] as const;
export type RangeKey=typeof RANGE_OPTIONS[number][0]|"custom";
export type RangeParams={range?:string;from?:string;to?:string};
export type AnalyticsRange={key:RangeKey;from:Date;to:Date;previousFrom:Date|null;previousTo:Date|null;bucket:"hour"|"day"|"week";fromInput:string;toInput:string;label:string;error?:string;comparison:string};
export function localDay(date:Date){return new Intl.DateTimeFormat("en-CA",{timeZone:ANALYTICS_TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);}
function midnight(day:string){return new Date(day+"T00:00:00+03:00");}
function validDay(day?:string):day is string{
  if(!day||!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
  const d=midnight(day);return Number.isFinite(+d)&&localDay(d)===day;
}
export function resolveAnalyticsRange(params:RangeParams,now=new Date(),earliest?:string):AnalyticsRange{
  let key=(params.range==="1"?"24h":params.range||"today") as RangeKey;
  if(![...RANGE_OPTIONS.map(x=>x[0]),"custom"].includes(key))key="today";
  const today=midnight(localDay(now));
  let from=new Date(today),to=new Date(now),error:string|undefined;
  if(key==="1h")from=new Date(+now-HOUR);
  else if(key==="24h")from=new Date(+now-DAY);
  else if(key==="yesterday"){from=new Date(+today-DAY);to=new Date(today);}
  else if(key==="all")from=earliest&&Number.isFinite(Date.parse(earliest))?midnight(localDay(new Date(earliest))):midnight("2020-01-01");
  else if(key==="custom"){
    if(validDay(params.from)&&validDay(params.to)){
      from=midnight(params.from);to=new Date(Math.min(+midnight(params.to)+DAY,+now));
      if(+from>=+to||+to-+from>366*DAY)error="Başlangıç bitişten önce olmalı; özel aralık en fazla 366 gün olabilir.";
    }else error="Geçerli bir başlangıç ve bitiş tarihi seçin.";
    if(error){key="today";from=new Date(today);to=new Date(now);}
  }else if(["7","30","90","365"].includes(key))from=new Date(+today-(Number(key)-1)*DAY);
  // Never issue an empty database interval exactly at midnight.
  if(+to<=+from)to=new Date(+from+1);
  const width=+to-+from;
  const previousFrom=key==="all"?null:new Date(key==="today"?+from-DAY:+from-width);
  const previousTo=key==="all"?null:new Date(key==="today"?+to-DAY:+from);
  const bucket=width<=2*DAY?"hour":width>90*DAY?"week":"day";
  return{key,from,to,previousFrom,previousTo,bucket,fromInput:localDay(from),toInput:localDay(new Date(+to-1)),
    label:RANGE_OPTIONS.find(x=>x[0]===key)?.[1]||"Özel aralık",error,
    comparison:key==="today"?"Dünün aynı saatine kadar olan dönemle karşılaştırılır.":"Önceki eşit uzunluktaki dönemle karşılaştırılır."};
}
export function bucketKey(date:string|Date,bucket:AnalyticsRange["bucket"]){
  const ms=bucket==="hour"?HOUR:bucket==="week"?7*DAY:DAY;
  const origin=Date.parse("2000-01-03T00:00:00+03:00");
  return new Date(origin+Math.floor((+new Date(date)-origin)/ms)*ms).toISOString();
}
export function rangeBuckets(range:AnalyticsRange){
  const step=range.bucket==="hour"?HOUR:range.bucket==="week"?7*DAY:DAY;
  const out:string[]=[];for(let n=Date.parse(bucketKey(range.from,range.bucket));n<+range.to;n+=step)out.push(new Date(n).toISOString());
  return out;
}
export function formatAnalyticsTime(date:string|Date,options:Intl.DateTimeFormatOptions={}){
  return new Date(date).toLocaleString("tr-TR",{timeZone:ANALYTICS_TIME_ZONE,...options});
}
