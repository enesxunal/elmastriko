import type { Metadata } from "next";
import { StoreProvider } from "@/components/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elmas Triko | Kadın & Erkek Triko",
  description: "Elmas Triko kadın ve erkek koleksiyonları. Yeni sezon triko, hırka, kazak ve zamansız parçalar.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body><StoreProvider>{children}</StoreProvider></body>
    </html>
  );
}
