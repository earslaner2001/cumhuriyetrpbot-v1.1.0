// main.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbPromise from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Veritabanı başlatma, tabloları oluşturma ve schema güncellemeleri
async function initializeDatabase() {
    try {
        const db = await dbPromise; // Veritabanı bağlantısını bekleyin

        // init.sql içeriğini oku ve çalıştır (tabloları oluşturur)
        const initSqlPath = path.join(__dirname, 'database', 'init.sql');
        const initSql = fs.readFileSync(initSqlPath, 'utf-8');
        await db.exec(initSql);
        console.log('📚 Veritabanı tabloları hazır veya güncel.');

        // 'kanunlar' tablosuna 'yururluge_giris_sekli' sütununun varlığını kontrol et ve ekle
        const kanunlarTableInfo = await db.all(`PRAGMA table_info(kanunlar);`);
        const yururlugeGirisSekliExists = kanunlarTableInfo.some(col => col.name === 'yururluge_giris_sekli');

        if (!yururlugeGirisSekliExists) {
            await db.run(`ALTER TABLE kanunlar ADD COLUMN yururluge_giris_sekli TEXT DEFAULT 'Bilinmiyor';`);
            console.log('✅ "yururluge_giris_sekli" sütunu "kanunlar" tablosuna eklendi.');
        } else {
            console.log('➡️ "yururluge_giris_sekli" sütunu "kanunlar" tablosunda zaten mevcut.');
        }

        // 'oylar' tablosuna 'tarih' sütununun varlığını kontrol et ve ekle
        const oylarTableInfo = await db.all(`PRAGMA table_info(oylar);`);
        const tarihColumnExistsInOylar = oylarTableInfo.some(col => col.name === 'tarih');

        if (!tarihColumnExistsInOylar) {
            await db.run(`ALTER TABLE oylar ADD COLUMN tarih TEXT;`);
            console.log('✅ "oylar" tablosuna "tarih" sütunu eklendi.');
        } else {
            console.log('➡️ "tarih" sütunu "oylar" tablosunda zaten mevcut.');
        }

    } catch (err) {
        console.error('Veritabanı başlatılırken/güncellenirken hata oluştu:', err);
    }
}

export { initializeDatabase };

// Bu dosya veritabanı başlatma görevini üstlendiği için Discord bot client'ını burada başlatmıyoruz.
// Bot client'ı index.js'de başlatılmalıdır.