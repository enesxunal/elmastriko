"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analyticsAllowed, currentAnalyticsPage } from "@/lib/analytics-client";
import { metaTrack } from "@/lib/meta-pixel";
export default function MetaPageView() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || !analyticsAllowed(pathname)) return;
    try { const page = currentAnalyticsPage(pathname); metaTrack("PageView", {}, page.id); } catch {}
  }, [pathname]);
  return null;
}
