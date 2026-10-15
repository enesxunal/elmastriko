import type { Metadata } from "next";
import Link from "next/link";
import { sendInfluencerLogin } from "../actions";
import "@/app/influencer/influencer.css";
export const metadata: Metadata = { title:"Influencer Girişi",robots:{index:false,follow:false} };
export default async function InfluencerLogin({searchParams}:{searchParams:Promise<{message?:string;error?:string}>}){
  const query=await searchParams;
  return <main className="affiliate-public-shell"><section className="affiliate-login-card"><Link href="/" className="affiliate-mark">ELMAS TRİKO</Link><small>İŞ BİRLİĞİ PROGRAMI</small><h1>Influencer Girişi</h1><p>Daveti aldığınız e-posta adresini girin. Size tek kullanımlık güvenli giriş bağlantısı göndereceğiz.</p>
    {query.message&&<p className="affiliate-alert success">{query.message}</p>}
    {query.error&&<p className="affiliate-alert error">{query.error}</p>}
    <form action={sendInfluencerLogin}><label>E-posta adresiniz<input type="email" name="email" required autoComplete="email" placeholder="ornek@mail.com"/></label><button className="affiliate-button">Giriş bağlantısı gönder</button></form>
    <p className="affiliate-muted">Yalnızca Elmas Triko tarafından davet edilen e-posta adresleri erişebilir. Şifre gerekmez.</p>
    <Link href="/" className="affiliate-muted">← Mağazaya dön</Link></section></main>;
}
