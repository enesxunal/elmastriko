export type EditorialFaq = {
  question: string;
  answer: string;
};

export type EditorialPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  seo_title: string;
  seo_description: string;
  published_at: string;
  updated_at: string;
  category: "Bakım" | "Kadın Stil" | "Erkek Stil" | "Trendler" | "Rehber";
  reading_time: number;
  faq?: EditorialFaq[];
};

export const editorialPosts: EditorialPost[] = [
  {
    slug: "triko-nasil-yikanir-bakim-rehberi",
    title: "Triko Nasıl Yıkanır? Formunu Korumak İçin Bakım Rehberi",
    excerpt: "Triko ürünleri yıkarken sıcaklık, program, deterjan, sıkma ve kurutma adımlarında nelere dikkat etmeniz gerektiğini öğrenin.",
    cover_image: "/images/signature-knit.webp",
    seo_title: "Triko Nasıl Yıkanır? Triko Bakım Rehberi",
    seo_description: "Triko nasıl yıkanır, hangi program seçilir ve triko nasıl kurutulur? Kazak ve hırkaların formunu korumaya yardımcı pratik bakım önerileri.",
    published_at: "2026-10-04T12:00:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Bakım",
    reading_time: 6,
    faq: [
      { question: "Triko kaç derecede yıkanır?", answer: "Ürünün bakım etiketi esas alınmalıdır. Makinede yıkamaya uygun birçok triko için düşük sıcaklık ve hassas program tercih edilir." },
      { question: "Triko kurutma makinesine atılır mı?", answer: "Bakım etiketinde açıkça izin verilmiyorsa kurutma makinesi yerine ürünü düz zeminde doğal formunda kurutmak daha güvenlidir." },
      { question: "Triko askıda kurutulur mu?", answer: "Islak triko ağırlığı nedeniyle uzayabilir. Bakım etiketi aksini söylemiyorsa düz zeminde kurutmak formu korumaya yardımcı olur." }
    ],
    content: `Triko ürünlerin uzun süre iyi görünmesinde doğru bakım rutini belirleyicidir. İlk adım her zaman ürünün iç etiketindeki yıkama ve bakım talimatlarını kontrol etmektir. İplik yapısı, örgü sıklığı ve aksesuar detayları benzer görünse bile farklı bakım gerektirebilir.

## Trikoyu yıkamadan önce ne yapılmalı?

Yıkama öncesinde fermuar ve düğmeleri kapatmak, ürünü ters çevirmek ve benzer renklerle birlikte yıkamak yüzey sürtünmesini azaltmaya yardımcı olur. Çok dolu bir makine, trikonun diğer parçalar arasında sıkışmasına ve gereksiz sürtünmeye maruz kalmasına neden olabilir.

## Triko hangi programda yıkanır?

Bakım etiketinde makinede yıkamaya izin veriliyorsa düşük sıcaklık ve hassas program tercih edilebilir. Yüksek sıcaklık bazı liflerde çekme ve form değişikliği riskini artırabilir.

- Hassas veya yünlü programı tercih edin.
- Ürünü ters çevirerek yıkayın.
- Ağır ağartıcılar yerine hassas tekstillere uygun deterjan kullanın.
- Yüksek devirli sıkmadan kaçının.

## Elde triko yıkarken nelere dikkat edilmeli?

Elde yıkama önerilen ürünlerde uzun süre suda bekletmek yerine kısa ve nazik bir işlem tercih edilmelidir. Trikoyu kuvvetlice ovalamak veya burarak suyunu çıkarmak örgü formunu bozabilir. Fazla suyu almak için ürünü temiz bir havlu arasına yerleştirip hafifçe bastırmak daha kontrollü bir yöntemdir.

## Triko nasıl kurutulur?

Islak triko ağırlığı nedeniyle askıda aşağı doğru uzayabilir ve omuzlarda iz bırakabilir. Bakım etiketi aksini söylemiyorsa ürünü düz bir yüzeyde, doğal formunu vererek kurutmak formun korunmasına yardımcı olur.

Trikoyu dolaba kaldırmadan önce tamamen kuruduğundan emin olun. Özellikle ağır örgüleri katlayarak saklamak askıda oluşabilecek uzamayı azaltır.

Elmas Triko kadın koleksiyonundaki kazak, hırka ve triko takımları incelerken her ürünün kendi bakım etiketini esas alın. Farklı iplik ve örgü yapıları farklı bakım gerektirebilir.`
  },
  {
    slug: "kadin-triko-kazak-kombinleri-2026",
    title: "Kadın Triko Kazak Kombinleri: 2026 Sonbahar-Kış Stil Rehberi",
    excerpt: "2026 sonbahar-kış sezonunda kadın triko kazakları pantolon, etek ve katmanlı görünümlerle kombinlemek için uygulanabilir stil fikirleri.",
    cover_image: "/images/category-women.webp",
    seo_title: "Kadın Triko Kazak Kombinleri 2026 | Stil Rehberi",
    seo_description: "Kadın triko kazak kombinleri için 2026 sonbahar-kış stil önerileri. V yaka, oversize, desenli ve klasik triko kazakları nasıl kombinleyebilirsiniz?",
    published_at: "2026-10-07T10:00:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Kadın Stil",
    reading_time: 7,
    faq: [
      { question: "Oversize triko kazak nasıl kombinlenir?", answer: "Hacimli üstü dengelemek için düz ya da daha kontrollü kesimli alt parçalar tercih edilebilir. Yüksek bel pantolon ve sade ayakkabılar pratik bir başlangıçtır." },
      { question: "V yaka triko kazak içine ne giyilir?", answer: "İnce gömlek, basic tişört veya sade bir iç katman tercih edilebilir. Yaka çizgisini fazla kalabalıklaştırmamak daha dengeli görünür." }
    ],
    content: `Kadın triko kazak, sonbahar-kış gardırobunun en çok kombin üreten parçalarından biridir. 2026 sezonunda güçlü örgü dokuları, V yakalar, çizgiler ve katmanlı görünümler öne çıkarken temel amaç trendi birebir kopyalamak değil, gardırobunuzdaki parçalarla tekrar kullanılabilir kombinler oluşturmaktır.

## Günlük kadın triko kazak kombini

Düz paça jean veya kumaş pantolon, sade bir triko kazak ve loafer ya da sneaker günlük kullanım için dengeli bir üçlüdür. Kazakta desen veya kontrast varsa alt parçayı daha sakin tutmak görünümü toparlar.

## V yaka triko kazak nasıl kombinlenir?

V yaka kazaklar tek başına kullanılabildiği gibi ince bir gömlek veya basic üstle katmanlanabilir. Daha belirgin bir yaka hattı istiyorsanız aksesuar sayısını sınırlamak kazak formunu öne çıkarır.

## Oversize triko kazak kombinleri

Oversize kazaklarda üst-alt oranını dengelemek önemlidir. Geniş hacimli bir üstü daha düz kesimli pantolon, dar olmayan ama kontrollü bir etek ya da yüksek bel alt parçalarla eşleştirebilirsiniz.

- Ekru kazak + koyu düz paça pantolon
- Desenli kazak + sade midi etek
- Oversize kazak + yüksek bel jean
- V yaka kazak + ince gömlek + kumaş pantolon

## Ofiste triko kazak nasıl giyilir?

Daha temiz bir siluet için triko kazakla aynı renk ailesindeki kumaş pantolonları eşleştirebilirsiniz. Yapılandırılmış bir çanta ve sade ayakkabı kombini günlük görünümden ofis stiline taşır.

## Renk seçimi nasıl yapılmalı?

Ekru, siyah, lacivert, gri ve toprak tonları farklı kombinlerde tekrar kullanılabilir. Daha güçlü renk veya desen içeren bir kazakta diğer parçaları nötr tutmak daha uzun ömürlü kombinler üretmenizi sağlar.

Elmas Triko kadın koleksiyonunda mevcut kazak ve triko modellerini renk, beden ve ürün formuna göre karşılaştırabilir; yeni gelen parçaları sezon kombinlerinize ekleyebilirsiniz.`
  },
  {
    slug: "kadin-triko-hirka-nasil-kombinlenir",
    title: "Kadın Triko Hırka Nasıl Kombinlenir? Günlük ve Şık Öneriler",
    excerpt: "Kadın triko hırkaları pantolon, etek ve katmanlı görünümlerle dengeli şekilde kombinlemek için pratik stil fikirleri.",
    cover_image: "/images/category-women.webp",
    seo_title: "Kadın Triko Hırka Nasıl Kombinlenir?",
    seo_description: "Kadın triko hırka kombinleri için günlük ve şık stil önerileri. Kısa, uzun ve desenli hırkalarda renk, doku ve oran dengesini planlayın.",
    published_at: "2026-10-04T12:05:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Kadın Stil",
    reading_time: 6,
    content: `Triko hırka, farklı parçalarla kolayca eşleşebildiği için gardırobun en işlevsel katmanlarından biridir. Kombini belirlerken hırkanın kesimi, dokusu, rengi ve üzerindeki düğme ya da şerit gibi detayları başlangıç noktası olarak kullanabilirsiniz.

## Kısa hırka nasıl kombinlenir?

Kısa ve daha yapılandırılmış hırkalarda yüksek bel pantolon veya etek tercih etmek oranı dengeler. Üst parçanın bel hattında bitmesi, alt parçayla daha net bir siluet oluşturur.

## Uzun hırka nasıl kombinlenir?

Daha uzun hırkalarda düz kesim pantolonlar veya daha sade alt parçalar görünümü sakinleştirebilir. Hırkanın kendisi hacimliyse alt katmanları ince tutmak hareket alanını korur.

## Desenli hırkada denge nasıl kurulur?

Kontrast şerit, metal düğme veya belirgin desen içeren bir hırka kullanıyorsanız kombinin diğer parçalarını daha nötr tutmak ürünü öne çıkarır. Ekru, siyah, lacivert, gri ve toprak tonları desenli trikolarla kolay eşleşir.

- Günlük: basic üst + triko hırka + jean
- Şık: triko hırka + kumaş pantolon + yapılandırılmış çanta
- Katmanlı: ince üst + hırka + uzun kaban
- Ton sür ton: aynı renk ailesinden üst, hırka ve alt parça

Aynı renk ailesindeki tonları birlikte kullanmak daha yumuşak bir görünüm oluşturur. Kontrast isteyenler ise açık-koyu dengesi kurabilir.

Elmas Triko kadın koleksiyonunda farklı renk, desen ve formdaki hırka modellerini karşılaştırabilir; ürün sayfalarında mevcut beden ve renk seçeneklerini görebilirsiniz.`
  },
  {
    slug: "hirka-kombinleri-kadin",
    title: "Hırka Kombinleri: Kadınlar İçin 15 Kullanışlı Stil Fikri",
    excerpt: "Kısa, uzun, oversize ve desenli hırkalar için günlük, ofis ve hafta sonu kombin fikirlerini tek rehberde keşfedin.",
    cover_image: "/images/edit-soft-structure.webp",
    seo_title: "Hırka Kombinleri: Kadınlar İçin 15 Stil Fikri",
    seo_description: "Hırka kombinleri için 15 kadın stil fikri. Kısa, uzun, oversize ve desenli triko hırkaları pantolon, etek ve elbiselerle kombinleyin.",
    published_at: "2026-10-07T10:10:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Kadın Stil",
    reading_time: 8,
    content: `Hırka, mevsim geçişlerinden kış katmanlarına kadar geniş kullanım alanı sunar. Doğru kombin, hırkanın boyu ve hacmiyle alt parçanın oranını dengelemekle başlar.

## Kısa hırka kombinleri

- Kısa hırka + yüksek bel jean + loafer
- Kısa hırka + midi etek + kısa bot
- Kısa hırka + geniş paça kumaş pantolon
- Kısa hırka + tek renk triko alt parça

## Uzun hırka kombinleri

- Uzun hırka + düz paça pantolon + basic üst
- Uzun hırka + monokrom iç katman
- Uzun hırka + midi elbise
- Uzun hırka + kemerli görünüm

## Oversize hırka kombinleri

Oversize bir hırka kullanırken iç katmanlarda daha sade formlar seçmek kombini ağırlaştırmaz. Geniş paça alt parçalar da kullanılabilir; ancak renkleri sade tutmak oranı daha kontrollü gösterir.

- Oversize hırka + straight jean
- Oversize hırka + tayt yerine kalın dokulu düz pantolon
- Oversize hırka + mini etek + opak çorap
- Oversize hırka + gömlek + kumaş pantolon

## Desenli hırka kombinleri

Desenli hırkayı kombinin odak noktası yapın. Alt ve iç katmanda tek renk kullanmak desenin güçlü görünmesini sağlar.

- Desenli hırka + siyah pantolon
- Çizgili hırka + ekru alt parça
- Kontrast şeritli hırka + düz jean

Hırka seçerken yalnızca trendi değil, dolabınızdaki alt parçalarla kaç farklı kombin üretebildiğinizi de düşünün. Elmas Triko kadın hırka modellerini bu mantıkla karşılaştırarak daha kullanışlı seçim yapabilirsiniz.`
  },
  {
    slug: "erkek-triko-kazak-kombinleri",
    title: "Erkek Triko Kazak Nasıl Kombinlenir? Günlük ve Şık Stil Rehberi",
    excerpt: "Erkek triko kazakları jean, chino, kumaş pantolon ve gömleklerle kombinlemek için sade ve uygulanabilir stil önerileri.",
    cover_image: "/images/signature-knit.webp",
    seo_title: "Erkek Triko Kazak Nasıl Kombinlenir?",
    seo_description: "Erkek triko kazak kombinleri için günlük ve şık öneriler. Bisiklet yaka, V yaka ve boğazlı kazakları jean, chino ve gömleklerle eşleştirin.",
    published_at: "2026-10-07T10:20:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Erkek Stil",
    reading_time: 7,
    faq: [
      { question: "Erkek triko kazak altına ne giyilir?", answer: "Günlük kullanımda jean veya chino, daha şık kombinlerde kumaş pantolon tercih edilebilir. Kazak formu ve ayakkabı seçimi kombinin seviyesini belirler." },
      { question: "Gömlek üstüne triko kazak giyilir mi?", answer: "Evet. Özellikle bisiklet yaka ve V yaka kazaklar ince gömleklerle katmanlanabilir. Gömlek yakasının ve manşetlerin fazla hacim oluşturmamasına dikkat edin." }
    ],
    content: `Erkek triko kazak, tek başına sade bir üst olarak da gömlekle katmanlanarak da kullanılabilir. İyi bir kombin için kazak kalıbı, yaka tipi, pantolon kesimi ve ayakkabının aynı stil seviyesinde olması yeterlidir.

## Günlük erkek triko kazak kombini

Bisiklet yaka bir triko kazak, düz jean veya chino pantolon ve sade sneaker günlük kullanım için güvenli bir kombin oluşturur. Kazak desenliyse pantolonu tek renk tutmak daha dengeli görünür.

## Gömlek üstüne triko kazak

İnce bir gömlek üzerine bisiklet yaka veya V yaka triko kazak giyebilirsiniz. İş ve akşam kombinlerinde kumaş pantolon veya koyu chino ile daha temiz bir görünüm elde edilir.

## V yaka erkek kazak nasıl kombinlenir?

V yaka, gömlek yakasını görünür bırakmak isteyenler için kullanışlıdır. Kravat kullanılacaksa örgünün ve gömleğin fazla kalın olmaması kombini daha düzenli gösterir.

## Boğazlı triko kazak kombini

Boğazlı kazakları kaban, yün ceket veya sade montlarla kullanabilirsiniz. Tek renk kombinler daha modern ve sakin bir görünüm verir.

- Lacivert kazak + gri kumaş pantolon
- Ekru kazak + koyu kahve chino
- Siyah boğazlı kazak + siyah pantolon + kaban
- V yaka kazak + beyaz gömlek + lacivert pantolon

Erkek triko seçiminde dolabınızdaki pantolon ve dış giyim renkleriyle tekrar kombinlenebilir modellere öncelik vermek kullanım alanını artırır.`
  },
  {
    slug: "2026-sonbahar-kis-triko-trendleri",
    title: "2026 Sonbahar-Kış Triko Trendleri: Bu Sezon Neler Öne Çıkıyor?",
    excerpt: "2026 sonbahar-kış sezonunda triko dünyasında öne çıkan V yaka, çizgi, güçlü örgü, yüksek yaka ve katmanlı kullanım eğilimlerini inceleyin.",
    cover_image: "/images/edit-modern-classics.webp",
    seo_title: "2026 Sonbahar-Kış Triko Trendleri",
    seo_description: "2026 sonbahar-kış triko trendleri: V yaka, çizgili örgüler, yüksek yaka, hırka ve katmanlı kullanım. Sezon trendlerini günlük stile uyarlayın.",
    published_at: "2026-10-07T10:30:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Trendler",
    reading_time: 7,
    content: `2026 sonbahar-kış sezonunda triko yalnızca sıcak tutan bir temel parça değil, kombinin ana karakterini belirleyen güçlü bir katman olarak öne çıkıyor. Sezon yayınları V yakalar, çizgili ve renkli örgüler, yüksek yakalar, belirgin hırkalar ve katmanlı kullanımlar üzerinde yoğunlaşıyor.

## V yaka ve katmanlı kullanım

V yaka trikolar gömlek, basic üst veya tek başına kullanım için esnek bir yapı sunuyor. Yaka çizgisini görünür bırakan kombinler özellikle ofis ve şehir stilinde güçlü bir seçenek.

## Çizgili ve renkli trikolar

Nötr gardıroplara hareket eklemek isteyenler için çizgili ve renk bloklu örgüler öne çıkıyor. Bu parçaları sade pantolon ve eteklerle eşleştirerek trikonun odak noktası olmasını sağlayabilirsiniz.

## Yüksek yakalar geri planda değil

Dik ve yüksek yakalı trikolar, kaban ve ceket altına tek katman olarak güçlü görünür. Özellikle monokrom kombinlerde doku farkı görünümü zenginleştirir.

## Hırkalar ana parça olarak kullanılıyor

Hırkayı yalnızca ara katman gibi değil, kapalı şekilde kazak alternatifi olarak kullanmak sezonun pratik yaklaşımlarından biri. Bel hizasında kısa modeller yüksek bel alt parçalarla; uzun modeller ise sade iç katmanlarla dengelenebilir.

## Trendi gardıroba nasıl uyarlamalı?

Trend parçayı satın almadan önce mevcut gardırobunuzdaki en az üç alt parçayla eşleşip eşleşmediğini kontrol edin. Böylece sezon görünümünü kısa ömürlü tek kombin yerine tekrar kullanılabilir bir parçaya dönüştürürsünüz.

Bu rehber hazırlanırken 2026 sezonuna ilişkin Vogue Türkiye ve Who What Wear trend yayınlarındaki ortak yönelimler referans alınmıştır. Elmas Triko koleksiyonunda trendleri birebir kopyalamak yerine zamansız kombinlere uyarlanabilen triko parçalarına odaklanabilirsiniz.`
  },
  {
    slug: "kazak-kac-derecede-yikanir",
    title: "Kazak Kaç Derecede ve Hangi Programda Yıkanır?",
    excerpt: "Kazak yıkama sıcaklığı, hassas program, sıkma devri ve kurutma konusunda en sık sorulan soruların kısa ve uygulanabilir yanıtları.",
    cover_image: "/images/signature-knit.webp",
    seo_title: "Kazak Kaç Derecede Yıkanır? Hangi Program Seçilir?",
    seo_description: "Kazak kaç derecede ve hangi programda yıkanır? Triko kazaklarda sıcaklık, sıkma, deterjan ve kurutma için pratik bakım rehberi.",
    published_at: "2026-10-07T10:40:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Bakım",
    reading_time: 5,
    faq: [
      { question: "Kazak 30 derecede yıkanır mı?", answer: "Bakım etiketi izin veriyorsa düşük sıcaklıkta yıkama tercih edilebilir. Kesin sıcaklık için ürün etiketini esas alın." },
      { question: "Kazak hangi programda yıkanır?", answer: "Etikette makinede yıkamaya izin veriliyorsa hassas veya yünlü program genellikle daha kontrollü bir seçenektir." },
      { question: "Kazak sıkma devri kaç olmalı?", answer: "Yüksek devir örgü formunu zorlayabilir. Bakım etiketinin izin verdiği düşük sıkma seçeneklerini tercih edin." }
    ],
    content: `Kazak yıkarken tek bir sıcaklık veya program tüm ürünler için doğru değildir. İplik karışımı, örgü yapısı ve üretici talimatı değiştiği için ilk kontrol her zaman bakım etiketi olmalıdır.

## Kazak kaç derecede yıkanmalı?

Bakım etiketi makinede yıkamaya izin veriyorsa düşük sıcaklık, özellikle triko ürünlerde daha kontrollü bir başlangıçtır. Yüksek sıcaklık çekme ve form değişikliği riskini artırabilir.

## Kazak hangi programda yıkanır?

Makinenizde hassas veya yünlü program varsa ve ürün etiketi makinede yıkamaya izin veriyorsa bu programlar tercih edilebilir. Programın kısa ve düşük mekanik hareketli olması örgünün gereksiz sürtünmesini azaltır.

## Kazak yıkarken sık yapılan hatalar

- Ürünü yüksek sıcaklıkta yıkamak
- Havlu ve denim gibi sert dokularla aynı yükte yıkamak
- Yüksek devirde sıkmak
- Islak kazağı askıya asmak
- Ürünü burarak suyunu çıkarmak

## Kazak nasıl kurutulur?

Bakım etiketi aksini söylemiyorsa düz zeminde, doğal formunu vererek kurutmak birçok triko için daha kontrollüdür. Islak ürünün ağırlığı askıda omuz ve boy formunu değiştirebilir.

Daha ayrıntılı bakım adımları için Elmas Journal'daki triko bakım rehberini inceleyebilir ve ürününüzün bakım etiketini temel alabilirsiniz.`
  },
  {
    slug: "triko-tuylenmesi-nasil-azaltilir",
    title: "Triko Tüylenmesi Nasıl Azaltılır? Kullanım ve Bakım Önerileri",
    excerpt: "Triko yüzeyinde oluşabilen tüylenmeyi azaltmak için sürtünme, yıkama, saklama ve düzenli bakım konusunda uygulanabilir öneriler.",
    cover_image: "/images/edit-modern-classics.webp",
    seo_title: "Triko Tüylenmesi Nasıl Azaltılır?",
    seo_description: "Triko tüylenmesi neden olur ve nasıl azaltılır? Sürtünmeyi azaltan kullanım alışkanlıkları, yıkama ve saklama önerileri.",
    published_at: "2026-10-04T12:10:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Bakım",
    reading_time: 5,
    content: `Triko yüzeyinde zamanla görülebilen küçük lif topları, kumaşın sürtünmeye maruz kalan bölgelerinde daha belirgin olabilir. Çanta askısı, mont iç yüzeyi, masa kenarı veya kol hareketleri gibi tekrar eden temaslar bu süreci hızlandırabilir.

## Tüylenme neden olur?

Lif uçları kullanım sırasında yüzeye çıkar ve sürtünmeyle küçük toplar oluşturabilir. Bu durum yalnızca ürün kalitesiyle değil, iplik yapısı ve kullanım yoğunluğuyla da ilişkilidir.

## Tüylenmeyi azaltmak için ne yapılabilir?

- Aynı trikoyu arka arkaya çok sık giymeyin.
- Çanta askısı ve sert dış yüzeylerle sürtünmeyi azaltın.
- Yıkama sırasında ürünü ters çevirin.
- Denim, havlu ve sert fermuarlı parçalarla aynı yükte yıkamayın.
- Ürünü temiz ve kuru şekilde katlayarak saklayın.

Tüylenme oluştuğunda kumaşı çekiştirmek yerine tekstil yüzeyleri için tasarlanmış uygun bakım araçlarını çok hafif uygulamak tercih edilebilir. Herhangi bir bakım aracını önce görünmeyen küçük bir alanda deneyin.

Doğru yıkama, daha düşük sürtünme ve düzenli saklama alışkanlıkları trikonun görünümünü daha uzun süre korumaya yardımcı olur.`
  },
  {
    slug: "kadin-triko-kazak-secimi",
    title: "Kadın Triko Kazak Seçerken Nelere Dikkat Edilmeli?",
    excerpt: "Kadın triko kazak seçiminde kalıp, renk, yaka, doku ve kullanım alanını birlikte değerlendirerek doğru modeli seçmek için pratik öneriler.",
    cover_image: "/images/signature-knit.webp",
    seo_title: "Kadın Triko Kazak Seçimi: Kalıp, Renk ve Stil Rehberi",
    seo_description: "Kadın triko kazak seçerken kalıp, yaka, renk, doku ve kullanım alanında nelere dikkat edilmeli? Günlük kombinler için pratik seçim rehberi.",
    published_at: "2026-10-04T12:15:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Rehber",
    reading_time: 6,
    content: `Kadın triko kazak seçerken yalnızca renk veya desen değil, kalıp, yaka formu, örgü dokusu ve ürünü hangi parçalarla kullanacağınız da önemlidir. Günlük kullanım için doğru seçim yapmak, kazaktan daha fazla kombin üretmeyi kolaylaştırır.

## Kalıp seçimi

Daha dar alt parçalarla rahat ve hacimli triko kazaklar dengeli bir görünüm oluşturabilir. Geniş paça pantolon veya daha hacimli eteklerle ise daha kontrollü üst formlar tercih edilebilir.

## Yaka seçimi

Yuvarlak yaka sade ve kolay katmanlanan bir seçenektir. V yaka modeller gömlek veya ince üstlerle birlikte kullanılabilir. Dik ya da yüksek yakalı trikolar ise tek başına daha belirgin bir üst silueti oluşturur.

## Renk ve doku seçimi

Ekru, gri, siyah, lacivert ve toprak tonları farklı kombinlerde tekrar kullanılabilir. Belirgin örgü, jakar veya desenli ürünlerde aksesuarları daha sınırlı kullanmak dengeli bir görünüm sağlar.

Beden seçiminde ürün sayfasındaki ölçü ve varyasyonları kontrol edin. Aynı beden etiketi farklı kalıplarda farklı durabilir; ürünün kesimini ve kullanım amacını birlikte değerlendirin.`
  },
  {
    slug: "triko-takim-nasil-kombinlenir",
    title: "Triko Takım Nasıl Kombinlenir? Şık ve Dengeli Stil Önerileri",
    excerpt: "Triko takım kombinlerinde ayakkabı, çanta, dış giyim ve aksesuar seçimini dengeli kurmak için pratik stil önerileri.",
    cover_image: "/images/edit-soft-structure.webp",
    seo_title: "Triko Takım Nasıl Kombinlenir? Kadın Stil Rehberi",
    seo_description: "Triko takım kombinleri için ayakkabı, çanta, dış giyim ve aksesuar seçiminde dengeli stil önerileri. Günlük ve şık kullanım fikirleri.",
    published_at: "2026-10-04T12:20:00+03:00",
    updated_at: "2026-10-07T15:30:00+03:00",
    category: "Kadın Stil",
    reading_time: 6,
    content: `Triko takım, üst ve alt parçanın aynı doku ve renk diliyle bir araya gelmesi sayesinde tek adımda bütünlüklü bir görünüm sağlar. Kombini kişiselleştirmenin en kolay yolu ayakkabı, çanta, dış giyim ve aksesuar seçimidir.

## Günlük triko takım kombini

Düz tabanlı ayakkabılar, sade sneaker veya loafer tarzı seçenekler triko takımın rahat yönünü destekler. Daha şık bir görünüm için topuklu ayakkabı veya daha yapılandırılmış bir çanta tercih edilebilir.

## Dış giyim seçimi

Takımın boyu ve hacmi önemlidir. Uzun etekli bir triko takımda kısa ceket veya bel hizasında biten dış giyim daha net bir oran oluşturabilir. Daha sade bir takımın üzerine uzun kaban eklemek ise akıcı bir siluet yaratabilir.

## Takım parçalarını ayrı kullanın

Triko üstü farklı bir pantolonla, eteği ise gömlek veya daha sade bir kazakla eşleştirebilirsiniz. Böylece tek bir takım yalnızca birlikte değil, ayrı kombinlerde de kullanılabilir.

Aksesuar seçiminde ürün üzerindeki düğme, zincir veya kontrast şerit gibi detayları referans almak faydalıdır. Güçlü detaylı ürünlerde aksesuar sayısını sınırlamak görünümü daha temiz tutar.`
  }
];

export function getEditorialPost(slug:string){
  return editorialPosts.find(post=>post.slug===slug) || null;
}
