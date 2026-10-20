export type AnalyticsReport={
  from:string;to:string;bucket:"hour"|"day"|"week";measurementStartedAt:string|null;lastEventAt:string|null;
  eventAlignmentStartedAt?:string|null;
  excludedTestSessions?:number;
  eventTotals?:Array<{kind:string;events:number;sessions:number}>;
  summary:{visitors:number;sessions:number;pageviews:number;activeMs:number;measuredSessions:number;measuredPages:number;activeNow:number;singlePageSessions:number};
  funnel:{sessions:number;product:number;cart:number;checkout:number;purchase:number;orders:number;revenue:number;unattributedPaidOrders:number};
  trend:Array<{at:string;views:number;sessions:number;visitors:number;activeMs:number;measuredSessions:number}>;
  pages:Array<{path:string;views:number;sessions:number;avgSeconds:number|null}>;
  sources:Array<{name:string;sessions:number;visitors:number;avgSeconds:number|null;purchases:number}>;
  devices:Array<{name:string;sessions:number;purchases:number}>;
  recent:Array<{id:string;started_at:string;source:string;entry_path:string;exit_path:string;device_type:string;pageviews:number;seconds:number|null}>;
};
export function analyticsDuration(seconds:number|null|undefined):string{
  if(seconds===null||seconds===undefined||!Number.isFinite(seconds))return "—";
  const n=Math.max(0,Math.round(seconds));if(n<60)return n+" sn";
  if(n<3600)return Math.floor(n/60)+" dk "+n%60+" sn";
  return Math.floor(n/3600)+" sa "+Math.floor(n%3600/60)+" dk";
}
export function analyticsPercent(value:number,total:number){return total>0?(100*value/total).toLocaleString("tr-TR",{maximumFractionDigits:1})+"%":"—";}
