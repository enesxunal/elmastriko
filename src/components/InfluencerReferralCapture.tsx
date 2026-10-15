"use client";
import { useEffect } from "react";

export default function InfluencerReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref || !/^[a-z0-9-]{2,40}$/.test(ref)) return;
    void fetch("/api/influencer/track", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref }),
    }).catch(() => undefined);
  }, []);
  return null;
}
