# Elmas Triko — mobil tasarım kontrolü

Tarih: 15 Ekim 2026

Durum: Düzeltmeler yerel çalışma dalında hazırlanmış ve üretim derlemesinde test edilmiştir. Canlıya gönderilmemiştir.

Dal: `fix/mobile-layout-review-20261015`
Başlangıç sürümü: `442a684`

## Yapılan düzeltmeler

| Alan | Değişiklik |
| --- | --- |
| Ürün listeleme kartları | Uzun ürün adları korunarak fiyat, favori ve sepete ekle alanları aynı satırda hizalandı. Görsellerin oranları ve kart boşlukları düzenlendi. |
| Mobil üst menü | Logo ortalandı. Arama ve sepet görünür tutuldu; hesap ve favorilere menü içinden erişim korundu. Dokunma alanları büyütüldü. |
| Menü davranışı | Panel üst alanın hemen altına bağlandı. Bağlantıya tıklama, dışarı tıklama ve Escape ile kapanma eklendi. Kısa ekranlarda panel kendi içinde kayıyor. |
| Ana sayfa | Ayrı kopya başlık kaldırılıp ortak StoreHeader kullanıldı. Mobil kart metinleri ve fiyat/favori alanları düzenlendi. Ürün detayına giden yanıltıcı “Hızlı ekle” metni “Ürünü incele” yapıldı. |
| Yeni Gelenler | Görsel bulunmamasına rağmen büyük alan kaplayan başlık, kısa ve okunaklı başlık alanına dönüştürüldü. Kadın/erkek ayrımı korundu. |
| Filtreler | Mobil dokunma hedefleri büyütüldü. Çok dar ekranda kategori seçenekleri kendi satırlarında yatay kaydırılabiliyor. |
| Ürün detayı | Sepete ekle düğmesi mobilde tam genişliğe alındı. Adet ve favori denetimleri ayrı satırda düzenlendi. Metin okunabilirliği artırıldı. |
| Sepet | Adet düğmeleri büyütüldü ve erişilebilir adları eklendi. |
| Ödeme ekranı | Genel düğme stillerinin indirim kodu girişini daraltması giderildi. Mobilde giriş ve Uygula düğmesi alt alta; form alanlarının yazıları okunaklı boyutta. |

Ödeme sağlayıcısı, kupon hesaplama, sipariş oluşturma ve ürün verisi mantığı değiştirilmedi. Müşteriye gösterilen eski geliştirme/entegrasyon yer tutucu metinleri sadeleştirildi.

## Test sonuçları

Yerel üretim derlemesi: `http://127.0.0.1:3108`.

- Altı ekran genişliği: 320, 360, 390, 430, 768 ve 1440 piksel.
- 26 farklı herkese açık yol/sayfayı kapsayan toplam 96 sayfa-genişlik senaryosu.
- 96/96 senaryoda HTTP 200; tam sayfa yatay taşması ve yakalanmamış JavaScript hatası görülmedi.
- İncelenen katalog kartlarında önceden ölçülen en yüksek düğme hizası farkı 20 piksel; son kontrollerde 0 piksel.
- Chromium ve WebKit üzerinde iPhone benzetimiyle 16'şar, toplam 32 müşteri etkileşim kontrolü başarılı.
- Kontroller: ana sayfa ve menü, kaydırılmış menü, kadın/erkek geçişi, sepete ekleme, adet artırma/azaltma, beden tablosu, tam genişlik satın alma alanı, indirim kodu alanına yazma/silme, kısa ekran menüsü ve 320 pikselde en sondaki kategori filtresine ulaşma.
- Dolu ödeme özeti ayrıca verisi tamamen yüklendikten sonra doğrulandı: 390 piksel sayfada indirim kodu girişi 286 piksel genişliğinde, üst menü konumu doğru, sayfa yatay taşmıyor.
- Varsayılan `npm run build` başarılı. Değiştirilen dosyalardaki lint denetimi: 0 hata; mevcut img kullanımları hakkında 9 optimizasyon uyarısı.
- Gerçek sipariş, ödeme veya mesaj gönderilmedi. Test sepetleri yalnızca izole tarayıcıların yerel depolamasındadır.

## Kapsam ve sınırlamalar

Kontrol ana sayfa, koleksiyonlar, yeni gelenler, ürün detayı, arama, favoriler, sepet, ödeme formu, hesap giriş/kayıt/şifre sayfaları, iletişim, sipariş takibi, kurumsal/bilgilendirme sayfaları ve influencer giriş/şifre ekranlarını kapsar. Her sayfa her genişlikte test edilmedi; toplam senaryo sayısı 96'dır.

Fiziksel iPhone/Android cihazı, gerçek Instagram uygulama içi tarayıcısı, yönetici girişinden sonraki tüm ekranlar ve bankanın ödeme ekranı bu kontrolün kapsamında değildir. WebKit benzetimi, gerçek cihaz testinin yerine geçtiği iddiasını taşımaz.

İlk WebKit denemelerinde çok sayıda tam sayfa yeniden gezinmesi (`page.goto`) sırasında Next ön-yükleme istekleriyle ilişkili erişim kontrolü konsol mesajları oluştu. Bu ayrı stres denemesi temiz konsol sonucu vermedi. Güvenlik/CORS ayarları değiştirilmedi ve hata kayıtları filtrelenmedi. Son regresyon testi müşteri gibi gerçek uygulama bağlantılarına tıklayarak ilerliyor; bu akışta iki tarayıcı motorunda da 32 kontrol ve yakalanmamış hata denetimi başarılı.

Dekoratif kayan yazı, spam koruması için kasıtlı gizlenmiş form alanı ve dar ekranda kendi içinde kayan kategori seçenekleri, bütün sayfanın taşması olarak değerlendirilmedi. Son kategori seçeneğinin kullanıcı tarafından erişilebilirliği ayrıca test edildi.

## Tekrar çalıştırma

Üretim derlemesini başlatın:

```sh
npm run build
npm run start -- -H 127.0.0.1 -p 3108
```

Ayrı terminalde:

```sh
AUDIT_BASE=http://127.0.0.1:3108 npm exec --yes --package=playwright@1.58.2 -- node scripts/qa-mobile-layout.cjs
```

Playwright sürümüne uygun Chromium ve WebKit tarayıcılarının kurulu olması gerekir. Test çıktıları varsayılan olarak Git tarafından dışlanan `.qa/mobile-layout` klasörüne yazılır.

## Teslim sınırı

Asıl çalışma klasöründeki bekleyen influencer/backend değişiklikleri korunmuştur. Bu düzeltmeler ayrı dalda hazırlanmıştır. Canlı dağıtım ve dağıtım sonrası doğrulama henüz yapılmamıştır.
