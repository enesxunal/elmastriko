import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";

export default function AccountPage(){return <><StoreHeader/><main className="account-page"><div><span>ELMAS HESABIM</span><h1>Tekrar hoş geldiniz.</h1><p>Üyeler siparişlerini, adreslerini ve favorilerini buradan yönetecek. Üyeliksiz alışveriş seçeneği checkout içinde ayrıca açık kalacak.</p></div><form><h2>Giriş Yap</h2><input type="email" placeholder="E-posta"/><input type="password" placeholder="Şifre"/><button type="button">Giriş Yap</button><a href="#">Hesap oluştur</a></form></main><StoreFooter/></>;}
