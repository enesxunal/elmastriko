"use client";
import { useActionState, useEffect } from "react";
import PasswordInput from "@/components/PasswordInput";
import { setInfluencerPassword, type PasswordFormState } from "../actions";

const initial: PasswordFormState = { error: "" };
export default function PasswordSetForm({ tokenHash, type }: { tokenHash: string; type: "invite" | "recovery" }) {
  const [state, action, pending] = useActionState(setInfluencerPassword, initial);
  // Remove one-time token from browser history and same-origin referrer before further navigation.
  useEffect(() => { window.history.replaceState(window.history.state, "", window.location.pathname); }, []);
  return <form action={action}>
    <input type="hidden" name="token_hash" value={tokenHash}/><input type="hidden" name="type" value={type}/>
    {state.error && <p className="affiliate-alert error" role="alert">{state.error}</p>}
    <label>Yeni şifre<PasswordInput name="password" minLength={10} maxLength={128} autoComplete="new-password" placeholder="En az 10 karakter" required/></label>
    <label>Yeni şifre tekrar<PasswordInput name="confirm_password" minLength={10} maxLength={128} autoComplete="new-password" placeholder="Şifrenizi tekrar girin" required/></label>
    <p className="affiliate-muted">10 karakter veya daha uzun bir şifre seçin. Daha önce başka bir yerde kullandığınız şifreyi tekrar kullanmayın.</p>
    <button type="submit" className="affiliate-button" disabled={pending}>{pending ? "Şifre kaydediliyor…" : "Şifremi oluştur"}</button>
  </form>;
}
