"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SESSION_TIMEOUT = 30 * 60 * 1000;

function uuid() {
  return crypto.randomUUID();
}

function getVisitorId() {
  const key = "et_visitor_id";
  let value = localStorage.getItem(key);
  if (!value) {
    value = uuid();
    localStorage.setItem(key, value);
  }
  return value;
}

function getSessionId() {
  const idKey = "et_session_id";
  const seenKey = "et_session_last_seen";
  const now = Date.now();
  const last = Number(sessionStorage.getItem(seenKey) || 0);
  let value = sessionStorage.getItem(idKey);
  if (!value || !last || now - last > SESSION_TIMEOUT) {
    value = uuid();
    sessionStorage.setItem(idKey, value);
  }
  sessionStorage.setItem(seenKey, String(now));
  return value;
}

function browserName() {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/")) return "Opera";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  if (ua.includes("Firefox/")) return "Firefox";
  return "Diğer";
}

function osName() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Diğer";
}

function deviceType() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone|iPod/.test(ua)) return "Mobil";
  return "Masaüstü";
}

function sourceInfo() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  let referrerHost = "";
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
  } catch {}

  if (utmSource) return { source: utmSource, medium: utmMedium, campaign, referrerHost };
  if (!referrerHost) return { source: "Direct", medium: null, campaign, referrerHost: "" };
  if (/google|bing|yandex|yahoo|duckduckgo/.test(referrerHost)) return { source: "Organik Arama", medium: "organic", campaign, referrerHost };
  if (/instagram|facebook|tiktok|x\.com|twitter|pinterest/.test(referrerHost)) return { source: "Sosyal Medya", medium: "social", campaign, referrerHost };
  return { source: "Referans", medium: "referral", campaign, referrerHost };
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const pageviewId = useRef<string | null>(null);
  const lastTick = useRef(0);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/yonetim") || pathname.startsWith("/api/")) return;
    if (navigator.webdriver || /bot|crawler|spider|slurp/i.test(navigator.userAgent)) return;

    const supabase = supabaseRef.current || createClient();
    supabaseRef.current = supabase;
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const { source, medium, campaign, referrerHost } = sourceInfo();
    let disposed = false;
    lastTick.current = Date.now();

    void supabase.rpc("track_analytics_page", {
      p_session_id: sessionId,
      p_visitor_id: visitorId,
      p_path: pathname,
      p_title: document.title,
      p_referrer: document.referrer || null,
      p_referrer_host: referrerHost || null,
      p_source: source,
      p_medium: medium,
      p_campaign: campaign,
      p_device_type: deviceType(),
      p_browser: browserName(),
      p_os: osName(),
      p_screen_width: window.innerWidth,
    }).then(({ data }) => {
      if (!disposed && data) pageviewId.current = String(data);
    });

    const flush = () => {
      const id = pageviewId.current;
      if (!id) return;
      const now = Date.now();
      const seconds = Math.min(60, Math.floor((now - lastTick.current) / 1000));
      if (seconds <= 0) return;
      lastTick.current = now;
      sessionStorage.setItem("et_session_last_seen", String(now));
      void supabase.rpc("track_analytics_engagement", {
        p_session_id: sessionId,
        p_pageview_id: id,
        p_seconds: seconds,
        p_path: pathname,
      });
    };

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") flush();
    }, 15000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else lastTick.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      flush();
      pageviewId.current = null;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  return null;
}
