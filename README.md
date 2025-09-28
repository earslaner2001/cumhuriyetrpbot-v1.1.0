# CumhuriyetRPBot v1.1.0

CumhuriyetRPBot, Discord için geliştirilmiş rol bazlı devlet simülasyonu botudur.  
Oyunculara başkan, bakan, asker, milletvekili ve halk gibi roller verilir;  
yasama, yürütme ve askeri sistem etkileşimli şekilde simüle edilir.

* **1.0.0** → İlk yayınlanan temel sürüm.
* **1.1.0** → Yeni özellikler eklenmiş ama büyük kırıcı değişiklik yok.
* **1.1.1** → Ufak bugfix/patch.

## Özellikler
- `/kanun-onayla` → %50 üzeri oy ile yasaların geçmesi.
- `/kanun-listele` → Yürürlükteki ve bekleyen kanunları embed listesiyle gösterir.
- Askerî sistem → Ordu ile yasa zorla geçirilebilir, iç güvenlik yasası destek sağlar.
- Halk memnuniyetsizliği → İç savaş tetiklenebilir.
- Kritik yasalar için halk oylaması yapılır.
- Web panel entegrasyonu planlanmaktadır.

## Kurulum
```bash
# Depoyu aç
unzip cumhuriyetrpbot-v1.1.0.zip
cd cumhuriyetrpbot-v1.1.0

# Bağımlılıkları yükle
npm install

# Botu başlat
npm run start
````

## Sürüm Notları (v1.1.0)

* Kanun onay mekanizması %50 şartına bağlandı.
* Kanun listeleme komutu eklendi.
* Kod yapısı modüler hale getirildi.
* Küçük performans iyileştirmeleri yapıldı.

## Yol Haritası

* [✅] Web panel geliştirmesi
* [✅] Ekonomi sistemi
* [✅] Seçim sistemi
* [✅] Daha gelişmiş rol komutları

## Lisans

Bu proje kişisel kullanım içindir.
Geliştirilip paylaşılması serbesttir, ticari amaçlı satışı yasaktır.