# Mağaza analitiği: aktif süre ve alışveriş hunisi

15 Ekim 2026. Başlangıç sürümü: `47b71ae`.

## Kapsam

Yönetim > İstatistikler ekranına Bugün, Dün, Son 1 saat, Son 24 saat, 7/30/90 gün, 1 yıl, tüm dönem ve başlangıç/bitiş tarihli özel aralık eklendi. Varsayılan Bugün. Saat dilimi Europe/Istanbul; özel seçimde bitiş günü dahildir. Bugün dünün aynı saatine kadarki dönemle; diğer aralıklar önceki eşit uzunluktaki dönemle karşılaştırılır.

Ziyaret, sayfa görüntüleme ve aktif süre grafiklerinde kısa aralıklar saatlik, uzun aralıklar günlük/haftalık gruplanır. Gün atlayarak örnekleme yapılmaz. Trafik istatistikleri SQL üzerinde hesaplanır; eski 5.000 oturum / 10.000 sayfa istemci sınırına bağlı değildir. Eski ticaret, stok ve ürün özetleri korunur.

## Aktif süre

Yeni sayaç görünür ve odaktaki sayfada çalışır. Sekme değişimi, arka plana geçme ve 60 saniye kullanıcı etkileşimi olmaması sayacı durdurur. Son etkileşimden itibaren 30 dakika geçince yeni oturum açılır. Sayfa geçişi ve kapanışta sendBeacon / keepalive ile son süre gönderilir. Tekrarlanan isteklerin kimliği aynı kalır; aynı olay ikinci kez süre veya sayfa sayısını artırmaz. Tarayıcı depolaması kapalıysa ölçüm bellek içinde çalışır.

Süre toplamı sadece yeni ölçülen olaylardan hesaplanır. Geçmiş ziyaret/sayfa kayıtları korunur ancak ölçülmemiş süreler tahmin edilmez. Ölçümü olmayan dönem/süre grafiği `—` / boşluk olarak gösterilir, sıfır süre varsayılmaz. Ölçümün başlama ve son olay zamanı ekranda belirtilir.

## Huni tanımı

Seçili dönemde başlayan ve yeni ölçüme dahil olan oturumlar kullanılır. Adımlar aynı oturum içinde sırayla aranır:

1. Siteye geliş.
2. Ürün detayını görüntüleme veya ürün kartından hızlı sepete ekleme.
3. Sepete ürün ekleme.
4. Dolu sepetle ödeme ekranına geçme.
5. Sunucu tarafından doğrulanmış ödenmiş sipariş.

Her aşamada bir oturum bir kez sayılır. Aynı oturumun birden fazla siparişi ayrı sipariş toplamına eklenir ancak dönüşen oturum sayısını şişirmez. Sipariş bağlama yalnızca service_role yetkili sunucu işlevinden yapılabilir. Tarayıcı satın alma olayı, sipariş numarası veya parasal değer gönderemez. Bekleyen, iptal, iade/geri dönüş durumları satış sayılmaz. Ödeme durumu rapor anındaki gerçek duruma göre değerlendirilir; sonradan onaylanan EFT geçmiş başlangıç oturumuna yansıyabilir. Ölçülmüş oturum bağlantısı olmayan ödenmiş siparişler ayrı uyarıdır, dönüşüm oranına katılmaz.

Bu kapalı oturum hunisidir: önceki gün başlayan oturum günlük trafik/aktif sürede görünebilir, fakat yeni başlangıç hunisine dahil olmaz. Başka cihazdaki ya da sonraki oturumdaki alışveriş kullanıcı bazında birleştirilmez.

## Veri sınırı ve erişim

Toplananlar: rastgele ziyaretçi/oturum kimliği, sorgu içermeyen sayfa yolu, olay zamanı, aktif milisaniye, ürün kısa adı, sınırlı kampanya/referrer-host ve cihaz sınıfı. Form değerleri, e-posta, telefon, IP ve tam referrer URL toplanmaz. Yönetim/API/auth/influencer rotaları, bilinen botlar, otomasyon, DNT/GPC ve yerel analitik opt-out hariç tutulur. Bu teknik sınırlar tek başına hukuki uygunluk beyanı değildir.

Rapor RPC'si yalnızca authenticated yetkisine açıktır ve ayrıca is_admin kontrolü yapar. Ham tablolarda RLS yönetici okuma politikası vardır. Olay alımı kısıtlı alan/kind listesi, istek boyutu ve oturum başına hız sınırı uygular. Analitik hatası sipariş oluşturmayı engellemez.

## Kurulum

Üretime uygulanacak tek yeni dosya: `supabase/migrations/20261015_analytics_funnel.sql`.

Migration mevcut ürün, sipariş ve ziyaret kayıtlarını değiştirmeden yeni olay/attribution tabloları ve işlevler ekler. Tekrar çalıştırılabilir. 15 Ekim'de Elmas Triko üretim Supabase projesinde uygulandı; uygulama öncesi/sonrası 10 sipariş, 30 ürün ve 1.406 eski oturum korundu. Halka açık rapor okuma ve tarayıcıdan sipariş bağlama yetkileri kapalı doğrulandı. Canlıya sahte sipariş/ödeme eklenmedi.

## Yerel doğrulamalar

- Üretim derlemesi başarılı; değişen uygulama kaynaklarında lint 0 hata, önceden var olan checkout img optimizasyon uyarısı 1.
- SQL regresyonu: 21 kontrol. Tekrar olay, sahiplik, admin yetkisi, bekleyen/ödenmiş/iade sipariş, 12.001 sayfa ve 1.501 oturumda eksiksiz toplam, dönem sınırı ve boş dönem.
- Tarih hesabı: 14 kontrol; üç farklı sunucu saat diliminde aynı Türkiye tarih sınırları.
- Tarayıcı ölçümü: görünürlük, odak/hareketsizlik, oturum yenileme, depolama hatası, opt-out, yabancı origin ve sahte satın alma olayının reddi. Ölçüm istekleri bu testte yakalanır; canlı veriye yazılmaz.
- Mobil görünüm: 320, 360, 390, 768, 1280 ve 1440 pikselde dolu, boş ve veri okunamıyor durumları; 18 senaryoda yatay sayfa taşması yok. Görsel testteki sayılar açıkça sentetik etiketlidir.

Testler `scripts/analytics-qa/` içindedir. SQL bootstrap yalnızca ayrı test konteynerine uygulanmalıdır; üretime uygulanmaz. Fiziksel cihaz ve gerçek ödeme testi yapılmadı.
