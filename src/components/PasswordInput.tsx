"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);
  return <span className="password-input-wrap">
    <input {...props} type={visible ? "text" : "password"} />
    <button type="button" className="password-visibility-toggle" aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={visible} onClick={() => setVisible(!visible)}>
      {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
    </button>
  </span>;
}
