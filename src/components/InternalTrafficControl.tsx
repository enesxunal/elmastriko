"use client";
import { analyticsExclusionReason } from "@/lib/analytics-identity";
import { useEffect, useState, useSyncExternalStore } from "react";
function snapshot() { try { return localStorage.getItem("et_analytics_opt_out") === "1"; } catch { return false; } }
function subscribe(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener("et-measurement-preference", listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener("et-measurement-preference", listener); }; }
export default function InternalTrafficControl() {
  useEffect(() => {
    try {
      if (localStorage.getItem("et_analytics_opt_out") === null) {
        localStorage.setItem("et_analytics_opt_out", "1");
        window.dispatchEvent(new Event("et-measurement-preference"));
      }
    } catch { /* Storage restrictions must not block administration. */ }
  }, []);
  const excluded = useSyncExternalStore(subscribe, snapshot, () => false);
  const reason = useSyncExternalStore(subscribe, () => analyticsExclusionReason("/"), () => null);
  const automatic = reason === "privacy" || reason === "automated" || reason === "preview";
  const [error, setError] = useState(false);
  return <div className="behavior-internal-control"><p><b>{automatic ? reason === "privacy" ? "Tarayıcınızın gizlilik tercihi nedeniyle mağaza ziyaretleri ölçülmüyor." : reason === "automated" ? "Otomatik test tarayıcısı olduğu için ziyaretler ölçülmüyor." : "Önizleme ortamındaki ziyaretler ölçülmüyor." : excluded ? "Bu tarayıcıdaki ziyaretler ölçüm dışında." : "Mağazada bu tarayıcıyla yaptığınız ziyaretler ölçülebilir."}</b><br/>Yönetici tarayıcısı varsayılan olarak hariç tutulur; tercihinizi buradan değiştirebilirsiniz. Yönetim sayfaları her durumda hariçtir.</p><button type="button" disabled={automatic} onClick={() => { try { if (excluded) localStorage.setItem("et_analytics_opt_out", "0"); else localStorage.setItem("et_analytics_opt_out", "1"); window.dispatchEvent(new Event("et-measurement-preference")); setError(false); } catch { setError(true); } }}>{excluded ? "Bu tarayıcıda ölçümü aç" : "Bu tarayıcıyı ölçümden çıkar"}</button>{error && <p role="alert">Tarayıcı tercihi kaydedilemedi.</p>}</div>;
}
