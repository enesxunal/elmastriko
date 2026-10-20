"use client";
import { useState, useSyncExternalStore } from "react";
function snapshot() { try { return localStorage.getItem("et_analytics_opt_out") === "1"; } catch { return false; } }
function subscribe(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener("et-measurement-preference", listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener("et-measurement-preference", listener); }; }
export default function InternalTrafficControl() {
  const excluded = useSyncExternalStore(subscribe, snapshot, () => false);
  const [error, setError] = useState(false);
  return <div className="behavior-internal-control"><p><b>{excluded ? "Bu tarayıcıdaki ziyaretler ölçüm dışında." : "Mağazada bu tarayıcıyla yaptığınız ziyaretler ölçülebilir."}</b><br/>Kendi denemelerinizin müşteri verisine karışmasını önlemek için bu tarayıcıyı hariç tutabilirsiniz. Yönetim sayfaları her durumda hariçtir.</p><button type="button" onClick={() => { try { if (excluded) localStorage.removeItem("et_analytics_opt_out"); else localStorage.setItem("et_analytics_opt_out", "1"); window.dispatchEvent(new Event("et-measurement-preference")); setError(false); } catch { setError(true); } }}>{excluded ? "Bu tarayıcıda ölçümü aç" : "Bu tarayıcıyı ölçümden çıkar"}</button>{error && <p role="alert">Tarayıcı tercihi kaydedilemedi.</p>}</div>;
}
