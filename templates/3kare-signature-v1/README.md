# 3 Kare Ajans — İz / İmza v1

Mobil uyumlu footer imzası. Gerçek ajans logosu, lila vurgu ve hover/klavye odağında üç kare hareketi. JavaScript, harici font, izleme veya üçüncü taraf isteği içermez. Azaltılmış hareket tercihine uyar.

## HTML / WordPress

1. `signature.css` ve `3kare-ajans-logo.png` dosyalarını sitenin kendi sunucusuna kopyalayın.
2. CSS dosyasını sayfaya ekleyin. `signature.html` içeriğini footer sonuna, ödeme ve yasal bağlantılardan sonra yerleştirin.
3. SVG içindeki `image href` yolunu yerel logo adresine göre güncelleyin.
4. Koyu zemin için `data-theme="dark"`, açık zemin için `data-theme="light"` kullanın. Arka plan üst siteden gelir.

CSS sınıfları `k3-` ile ayrılmıştır. Renkler `--signature-accent`, `--signature-ink`, `--signature-muted`, `--signature-line` değişkenleriyle uyarlanabilir. Tek görünür bağlantı https://3kareajans.com/ adresini yeni sekmede açar.

## React / Next.js

`AgencySignature.tsx` ve `AgencySignature.module.css` dosyalarını birlikte kopyalayın. Logoyu `public/brand/3kare-ajans-logo.png` adresine yerleştirin veya `logoSrc` özelliğiyle başka bir yerel adres verin. Footer sonunda `<AgencySignature />` kullanın. Açık zemin: `<AgencySignature theme="light" />`.

## Önizleme

`preview.html` koyu ve açık varyantları gösterir. Yayına almadan önce 320/390 px mobil ve masaüstünde taşmayı, logoyu, klavyeyle odağı ve bağlantı hedefini kontrol edin. İmzayı ödeme formuna veya sabit kaplama olarak eklemeyin.

Kaynak logo: https://3kareajans.com/wp-content/uploads/2023/11/3kareajanslogo4.png. Şekli değiştirilmez; SVG viewBox yalnızca şeffaf kenar boşluklarını kırpar.

Sürüm: 1.0 · 21 Ekim 2026 · İlk kullanım: Elmas Triko.
