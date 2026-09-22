import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ContactForm from "@/components/ContactForm";
import { company } from "@/lib/company";

export default function ContactPage() {
  return <><StoreHeader/><main className="content-page">
    <section className="content-hero"><span>İLETİŞİM</span><h1>Elmas Triko’ya ulaşın.</h1><p>Ürün, sipariş, teslimat ve satış sonrası konularda formu kullanabilirsiniz.</p></section>
    <section className="contact-layout">
      <div className="contact-card"><span>ŞİRKET</span><h2>{company.legalName}</h2><p>{company.address}</p><p>MERSİS: {company.mersis}<br/>Ticaret Sicil No: {company.registryNo}</p></div>
      <div className="contact-card muted"><span>İLETİŞİM KANALLARI</span><h2>Yayına hazırlık aşamasında.</h2><p>Telefon ve e-posta bilgileri müşteriden teyit edildiğinde bu alan canlı iletişim kanallarıyla güncellenecek.</p></div>
    </section>
    <section className="contact-form-section"><div><span>MESAJ GÖNDER</span><h2>Size nasıl yardımcı olabiliriz?</h2><p>Mesajlar yönetim paneline düşer ve müşteri tarafından takip edilebilir.</p></div><ContactForm/></section>
  </main><StoreFooter/></>;
}
