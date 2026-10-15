"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {analyticsAllowed,currentAnalyticsPage,enqueueAnalytics,flushAnalytics} from "@/lib/analytics-client";
import {touchSession} from "@/lib/analytics-identity";

export default function AnalyticsTracker(){
  const pathname=usePathname();
  useEffect(()=>{
    if(!pathname||!analyticsAllowed(pathname))return;
    let target:ReturnType<typeof currentAnalyticsPage>;
    try{target=currentAnalyticsPage(pathname);}catch{return;}
    let tick=performance.now(),lastInput=Date.now(),pending=0;
    let visible=document.visibilityState==="visible"&&document.hasFocus();
    const sample=()=>{
      const now=performance.now(),wall=Date.now();
      const elapsed=Math.max(0,Math.min(20000,now-tick));
      // Stop accumulating when hidden, unfocused or idle for over one minute.
      if(visible)pending+=Math.max(0,Math.min(elapsed,60000-(wall-lastInput-elapsed)));
      tick=now;
    };
    const flush=(closing=false)=>{
      sample();if(pending>=1){enqueueAnalytics(target,"engagement",Math.min(20000,Math.round(pending)));pending=0;touchSession(target.session);}
      void flushAnalytics(closing);
    };
    const activate=()=>{
      sample();lastInput=Date.now();tick=performance.now();visible=document.visibilityState==="visible"&&document.hasFocus();
      if(visible)target=currentAnalyticsPage(pathname);
    };
    const onVisibility=()=>{flush(document.visibilityState==="hidden");visible=document.visibilityState==="visible"&&document.hasFocus();if(visible)activate();};
    const onBlur=()=>{flush(true);visible=false;};
    const onHide=()=>{flush(true);visible=false;};
    const onInput=()=>{sample();lastInput=Date.now();if(visible)target=currentAnalyticsPage(pathname);};
    const timer=setInterval(()=>flush(),15000);
    document.addEventListener("visibilitychange",onVisibility);
    window.addEventListener("focus",activate);window.addEventListener("blur",onBlur);
    window.addEventListener("pagehide",onHide);window.addEventListener("pageshow",activate);
    const interactions=["pointerdown","keydown","touchstart","scroll"] as const;
    interactions.forEach(name=>window.addEventListener(name,onInput,{passive:true}));
    return()=>{
      flush();clearInterval(timer);document.removeEventListener("visibilitychange",onVisibility);
      window.removeEventListener("focus",activate);window.removeEventListener("blur",onBlur);
      window.removeEventListener("pagehide",onHide);window.removeEventListener("pageshow",activate);
      interactions.forEach(name=>window.removeEventListener(name,onInput));
    };
  },[pathname]);
  return null;
}
