"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Optional Google sign-in; does not change the existing guest checkout or password login. */
export default function GoogleAuthButton({ next = "/hesabim" }: { next?: "/hesabim" | "/checkout" }) {
  const [available, setAvailable] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/providers", { signal: controller.signal })
      .then((res) => res.ok ? res.json() as Promise<{ google?: boolean }> : null)
      .then((data) => { if (!controller.signal.aborted) setAvailable(data?.google === true); })
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, []);

  async function signInWithGoogle() {
    if (pending) return;
    setPending(true);
    setErrorText("");
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", next);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Google giriş adresi oluşturulamadı.");
      // Supabase normally redirects itself; explicit fallback for browsers that do not.
      window.location.assign(data.url);
    } catch {
      setErrorText("Google ile giriş başlatılamadı. E-posta ile devam edebilirsiniz.");
      setPending(false);
    }
  }

  if (!available) return null;

  return <div className={next === "/checkout" ? "google-auth checkout-google-option" : "google-auth"} data-google-auth>
    <button type="button" className="google-auth-button" onClick={signInWithGoogle} disabled={pending} aria-busy={pending}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.42-.18-2.11H12v4.01h5.39a4.61 4.61 0 0 1-2 3.03v2.52h3.24c1.89-1.75 2.97-4.33 2.97-7.45Z"/>
        <path fill="#34A853" d="M12 22c2.69 0 4.94-.89 6.59-2.41l-3.24-2.52c-.9.6-2.05.95-3.35.95a5.98 5.98 0 0 1-5.63-4.13H3.03v2.6A10 10 0 0 0 12 22Z"/>
        <path fill="#FBBC05" d="M6.37 13.89a6.06 6.06 0 0 1 0-3.78v-2.6H3.03a10 10 0 0 0 0 8.98l3.34-2.6Z"/>
        <path fill="#EA4335" d="M12 5.98c1.46 0 2.77.5 3.8 1.5l2.85-2.85A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.97 5.51l3.34 2.6A5.98 5.98 0 0 1 12 5.98Z"/>
      </svg>
      {pending ? "Google açılıyor..." : "Google ile devam et"}
    </button>
    {next === "/checkout" && <small>Hızlı giriş isteğe bağlıdır. Üye olmadan aşağıdaki formdan alışveriş yapabilirsiniz.</small>}
    {errorText && <p className="google-auth-error" role="alert">{errorText}</p>}
  </div>;
}
