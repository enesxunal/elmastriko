import Link from "next/link";
import { signOut } from "@/app/auth/actions";

const accountLinks = [
  ["/hesabim", "Genel Bakış"],
  ["/hesabim/siparisler", "Siparişlerim"],
  ["/hesabim/adresler", "Adreslerim"],
  ["/hesabim/profil", "Profilim"],
  ["/hesabim/guvenlik", "Güvenlik"],
  ["/favoriler", "Favorilerim"],
] as const;

export default function AccountShell({
  name,
  email,
  current,
  children,
}: {
  name: string;
  email: string;
  current: string;
  children: React.ReactNode;
}) {
  return <main className="account-dashboard account-shell">
    <aside className="account-side">
      <div className="account-side-user">
        <span>ELMAS HESABIM</span>
        <strong>{name}</strong>
        <small>{email}</small>
      </div>
      <nav>
        {accountLinks.map(([href,label]) => <Link key={href} href={href} className={current === href ? "active" : ""}>{label}</Link>)}
      </nav>
      <form action={signOut}><button type="submit">Çıkış Yap</button></form>
    </aside>
    <section className="account-content">{children}</section>
  </main>;
}
