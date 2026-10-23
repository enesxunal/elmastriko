"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
export default function CheckoutJourneyRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 30000);
    return () => window.clearInterval(timer);
  }, [router]);
  return <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} style={{border:"1px solid #dfe6df",borderRadius:8,padding:"10px 14px",background:"white",cursor:"pointer",color:"#315e4b"}}>{pending?"Yenileniyor…":"Şimdi yenile"}<small style={{display:"block",fontSize:11,marginTop:4}}>30 sn’de bir otomatik güncellenir</small></button>;
}
