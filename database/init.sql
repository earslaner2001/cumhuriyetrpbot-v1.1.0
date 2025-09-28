-- kanunlar tablosu oluştur
CREATE TABLE IF NOT EXISTS kanunlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baslik TEXT NOT NULL,
    icerik TEXT NOT NULL,
    teklif_sahibi TEXT NOT NULL,
    durum TEXT DEFAULT 'Oylamada', -- Oylamada, Yürürlükte, Reddedildi
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- oylar tablosu oluştur
CREATE TABLE IF NOT EXISTS oylar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_id TEXT NOT NULL,
    kanun_id INTEGER NOT NULL,
    oy TEXT CHECK (oy IN ('evet', 'hayır')),
    tarih TEXT NOT NULL, -- BU SATIRIN OLDUĞUNDAN ÇOK EMİN OLUN!
    UNIQUE(kanun_id, kullanici_id),
    FOREIGN KEY (kanun_id) REFERENCES kanunlar(id)
);

-- panel_kullanicilari tablosu oluştur (varsayılan yetkiliRol için)
CREATE TABLE IF NOT EXISTS panel_kullanicilari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_adi TEXT NOT NULL UNIQUE,
    sifre TEXT NOT NULL,
    rol TEXT DEFAULT 'üye' -- 'admin', 'moderator', 'üye' vb.
);

CREATE TABLE IF NOT EXISTS oyun_durumu (
  id INTEGER PRIMARY KEY DEFAULT 1,
  memnuniyet_seviyesi INTEGER DEFAULT 75, -- Başlangıçta %75 memnuniyet
  isyan_aktif BOOLEAN DEFAULT 0, -- 0: pasif, 1: aktif
  son_isyan_tarihi TEXT
);

-- İlk çalıştırmada bir başlangıç kaydı ekleyin (eğer yoksa)
INSERT OR IGNORE INTO oyun_durumu (id, memnuniyet_seviyesi, isyan_aktif) VALUES (1, 75, 0);