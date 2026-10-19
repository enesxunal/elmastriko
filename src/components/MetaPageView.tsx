"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export default function MetaPageView() {
  const pathname=usePathname();
  useEffect(()=>{if(pathname && window.fbq)window.fbq("track","PageView");},[pathname]);
  return null;
}
