# 🏛️ CumhuriyetRPBot v1.1.1

CumhuriyetRPBot, Discord sunucunuzda bir **demokratik sistem** kurmanızı sağlar.  

Oyunculara **başkan, bakan, asker, milletvekili ve halk** rolleri verilir;  
**yasama, yürütme ve askeri sistem** tam etkileşimli şekilde simüle edilir.

## 🚀 Sürüm Geçmişi
* **1.0.0** → İlk yayınlanan temel sürüm
* **1.1.0** → Modern web paneli, glassmorphism UI, responsive tasarım, Chart.js entegrasyonu
* **1.1.1** → Discord markdown desteği (bold, italic, code, links vb.), paragraf formatlama

## ✨ Özellikler

### 🎮 **Discord Bot Komutları**
- **`/kanun-teklifi`** → Yeni yasa önerisi oluştur
- **`/kanun-onayla`** → Yasaları %50+ oy ile onaylama sistemi
- **`/kanun-listele`** → Aktif ve beklemedeki yasaları modern embed ile görüntüle
- **`/halk-oyla`** → Kritik konular için halk oylaması düzenle
- **`/rol-atama`** → Oyunculara devlet rolleri ata
- **`/ordu-darbe`** → Askeri müdahale simülasyonu
- **`/isyan`** → Halk ayaklanması sistemi

### 🌐 **Modern Web Paneli**
- **Glassmorphism tasarım** → Cam efektli modern arayüz
- **Discord markdown desteği** → Bold, italic, code, strikethrough, blockquote, links
- **Breathing animasyonlar** → Soluk alan buton efektleri
- **Responsive tasarım** → Mobil ve desktop uyumlu
- **Chart.js entegrasyonu** → Görsel istatistik grafikleri
- **Admin dashboard** → Kanun ve oyuncu yönetimi
- **Session güvenliği** → Güvenli giriş sistemi

### ⚖️ **Devlet Simülasyonu**
- **Demokratik sistem** → Gerçekçi oy mekanizması
- **Rol tabanlı yetkilendirme** → Başkan, bakan, milletvekili rolleri
- **Askerî sistem** → Ordu ile zorunlu yasa geçirme
- **İç güvenlik** → Güvenlik güçleri desteği
- **Halk memnuniyeti** → Dinamik tepki sistemi

## 🛠️ Kurulum

### Gereksinimler
- **Node.js** v16.9.0 veya üzeri
- **Discord Bot Token** (Discord Developer Portal'dan)
- **SQLite** (otomatik kurulur)

### Adım adım kurulum
```bash
# 📁 Projeyi indirin
git clone https://github.com/username/cumhuriyetrpbot.git
cd cumhuriyetrpbot-v1.1.0

# 📦 Bağımlılıkları yükleyin
npm install

# ⚙️ .env dosyasını oluşturun
cp .env.example .env
# TOKEN ve diğer bilgileri düzenleyin

# 🚀 Botu başlatın (Normal Mod)
npm run start

# 🔥 Botu shard sistemi ile başlatın (Büyük sunucular için)
npm run shard              # Varsayılan 3 shard
npm run shard:auto         # Discord otomatik belirler
npm run shard:2            # 2 shard
npm run shard:5            # 5 shard

# Windows için .bat dosyaları
start-normal.bat           # Normal mod
start-shard.bat            # 3 shard (varsayılan)
start-shard.bat 5          # 5 shard
start-shard.bat auto       # Otomatik

# 🌐 Web paneli
# Panel: http://localhost:3000
# Admin: admin / 123456
```

### 🌟 Sharding Nedir?
**Sharding**, botunuzu birden fazla parçaya bölerek **büyük sunucularda performans artışı** sağlar:

- 🔹 **0-2499 sunucu**: Normal mod yeterli
- 🔹 **2500+ sunucu**: Sharding zorunlu (Discord kuralı)
- 🔹 **Avantajları**: Daha hızlı yanıt, daha az RAM, daha stabil bot

**Örnek Kullanım:**
```bash
# 3 shard ile başlat (her shard 833 sunucu yönetir)
npm run shard

# Manuel shard sayısı belirle
node shard.js 5
```

### 🔧 Yapılandırma
1. **config.js** dosyasında bot ayarlarını düzenleyin
2. **database/init.sql** ile veritabanı tablolarını oluşturun
3. Discord sunucunuzda bot'a gerekli yetkiler verin

## 🎯 Sürüm Notları (v1.1.1)

### 🆕 **Yeni Özellikler**
- ✅ **Discord Markdown Desteği** → Web panelinde Discord markdown formatlama
- ✅ **Paragraf Formatlama** → Çift satır sonları ile paragraf ayrımı
- ✅ **Gelişmiş Metin Görüntüleme** → Kalın, italik, kod, bağlantı desteği

### 🔉 **Güncellenen Özellikler (v1.1.0)**
- ✅ **Modern Web Paneli** → Glassmorphism tasarımlı admin arayüzü
- ✅ **Breathing Animasyonlar** → Soluk alan buton efektleri
- ✅ **Chart.js Entegrasyonu** → Görsel istatistik grafikleri
- ✅ **Responsive Design** → Mobil ve tablet uyumluluğu
- ✅ **Session Authentication** → Güvenli admin giriş sistemi
- ✅ **Professional Branding** → Tüm arayüzlerde tutarlı görünüm

### 🔄 **Güncellemeler**
- 🔧 Kanun onay mekanizması %50+ oy şartına bağlandı
- 🔧 Kanun listeleme komutu modern embed tasarımıyla yenilendi
- 🔧 Kod yapısı modüler mimari ile yeniden düzenlendi
- 🔧 Database entegrasyonu tamamen yenilendi

### ⚡ **Performans İyileştirmeleri**
- 🚀 Optimize edilmiş veritabanı sorguları
- 🚀 Daha hızlı embed rendering
- 🚀 Gelişmiş error handling sistemi

## 🗺️ Yol Haritası

### ✅ **Tamamlanan (v1.1.1)**
- ✅ **Discord markdown parser** → Web panelinde metin formatlama
- ✅ **Paragraf desteği** → Düzgün satır sonları ve paragraflar
- ✅ **Modern web paneli** → Glassmorphism UI tamamlandı
- ✅ **Database entegrasyonu** → SQLite tam entegre edildi
- ✅ **Responsive tasarım** → Mobil uyumluluk sağlandı
- ✅ **Professional branding** → Tutarlı v1.1.1 görünümü

### 🔄 **Geliştiriliyor (v1.2.0)**
- 🔨 **Ekonomi sistemi** → Sanal para ve vergi sistemi
- 🔨 **Seçim sistemi** → Otomatik başkanlık seçimleri
- 🔨 **Notification sistemi** → Real-time bildirimler
- 🔨 **API endpoints** → RESTful API geliştirmesi

### 🎯 **Planlandı (v1.3.0+)**
- 📋 **Advanced rol sistemi** → Daha detaylı yetki sistemi
- 📋 **Multi-server support** → Çoklu sunucu desteği
- 📋 **Analytics dashboard** → Detaylı istatistik paneli
- 📋 **Mobile app** → React Native mobil uygulama

## 📸 Ekran Görüntüleri

### 🌐 Web Paneli
- **Modern giriş sayfası** → Glassmorphism efektli tasarım
- **Admin dashboard** → Chart.js grafikleri ile istatistikler
- **Kanun yönetimi** → Detaylı kanun takip sistemi

### 🤖 Discord Embeds
- **Professional footer** → Tüm komutlarda v1.1.1 branding
- **Renkli embed'ler** → Görsel kategori sistemi
- **Interactive buttons** → Kolay kullanım arayüzü

## 📞 Destek & İletişim

### 🐛 **Bug Raporu**
Hata bulduğunuzda lütfen aşağıdaki bilgileri paylaşın:
- Discord.js sürümü
- Node.js sürümü  
- Hata mesajı
- Hangi komut/özellikte oluştu

### 💡 **Özellik İsteği**
Yeni özellik önerileri için GitHub Issues kullanın.

### 🤝 **Katkıda Bulunma**
1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'i push edin (`git push origin feature/YeniOzellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje **kişisel ve eğitim amaçlı kullanım** içindir.  
✅ **İzin verilen:** Geliştirme, paylaşım, özelleştirme  
❌ **Yasak olan:** Ticari satış, telif hakkı ihlali

---

<div align="center">

**🏛️ CumhuriyetRPBot v1.1.1**  
*Modern Discord devlet simülasyonu deneyimi*

Made with by Forbir's Developers

</div>