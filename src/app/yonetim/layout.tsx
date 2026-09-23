import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const displayName = profile.full_name || "Elmas Triko";
  return <div className="admin-shell">
    <AdminNav/>
    <div className="admin-main">
      <header className="admin-top">
        <div className="admin-top-title"><span>ELMAS TRİKO</span><b>Yönetim Merkezi</b></div>
        <div className="admin-top-actions">
          <Link href="/" className="admin-preview-link">Siteyi görüntüle</Link>
          <div className="admin-user-chip"><span>{displayName.slice(0,1).toUpperCase()}</span><div><b>{displayName}</b><small>Yönetici</small></div></div>
        </div>
      </header>
      {children}
    </div>
  </div>;
}
