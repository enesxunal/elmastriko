import type { NextConfig } from "next";

const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const protectedHeaders = [
  ...securityHeaders,
  { key: "Cache-Control", value: "no-store, max-age=0" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/yonetim/:path*", headers: protectedHeaders },
      { source: "/hesabim/:path*", headers: protectedHeaders },
    ];
  },
  async redirects() {
    return [
      { source: "/urun/elmas-urun-1", destination: "/urun/zincir-detayli-triko-etek-takim", permanent: true },
      { source: "/urun/elmas-urun-2", destination: "/urun/bordo-lacivert-baklava-desenli-hirka", permanent: true },
      { source: "/urun/elmas-urun-4", destination: "/urun/gri-beyaz-dokulu-dugmeli-hirka", permanent: true },
      { source: "/urun/elmas-urun-6", destination: "/urun/ekru-vizon-cicek-desenli-kapusonlu-hirka", permanent: true },
      { source: "/urun/elmas-urun-7", destination: "/urun/vizon-geometrik-desenli-dokulu-hirka", permanent: true },
      { source: "/urun/elmas-urun-8", destination: "/urun/lacivert-ekru-cizgili-dugmeli-hirka", permanent: true },
      { source: "/urun/elmas-urun-9", destination: "/urun/ekru-bej-cicek-desenli-yumusak-kazak", permanent: true },
    ];
  },
};

export default nextConfig;
