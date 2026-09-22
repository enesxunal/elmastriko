import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return <div className="admin-shell"><AdminNav/><div className="admin-main"><header className="admin-top"><div><span>YÖNETİM PANELİ</span><b>{profile.full_name || "Elmas Triko"}</b></div><Link href="/">Mağazaya dön →</Link></header>{children}</div></div>;
}
