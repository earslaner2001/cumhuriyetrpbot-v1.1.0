// panel/server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dbPromise from '../database/db.js'; // dbPromise'ı import et
import config from '../config.js'; // config objesini default import olarak al

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.panel.port || 3000; // Portu config objesinden al

// EJS ve static dosya ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // Eğer public klasörünüz varsa

// Middleware'ler
app.use(express.urlencoded({ extended: true })); // Form verilerini işlemek için
app.use(express.json()); // JSON verilerini işlemek için

// Ana sayfa
app.get('/', async (req, res) => {
    try {
        const db = await dbPromise; // Veritabanı bağlantısını al
        const kanunlar = await db.all('SELECT * FROM kanunlar ORDER BY id DESC');
        res.render('index', { kanunlar, footer: config.embed.footer, thumbnail: config.embed.thumbnail }); // config objesinden erişildi
    } catch (err) {
        console.error("Paneli ana sayfa yüklenirken hata:", err);
        res.status(500).send("Ana sayfa yüklenirken bir hata oluştu.");
    }
});

// Kanun detay sayfası
app.get('/kanun/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const db = await dbPromise; // Veritabanı bağlantısını al
        const kanun = await db.get('SELECT * FROM kanunlar WHERE id = ?', id);
        if (!kanun) {
            return res.status(404).send('Kanun bulunamadı.');
        }
        // Kanuna ait oyları da çek
        const oylar = await db.all('SELECT oy FROM oylar WHERE kanun_id = ?', id);
        res.render('detay', { kanun, oylar, footer: config.embed.footer, thumbnail: config.embed.thumbnail }); // config objesinden erişildi
    } catch (err) {
        console.error("Panelde kanun detayı yüklenirken hata:", err);
        res.status(500).send("Kanun detayı yüklenirken bir hata oluştu.");
    }
});

// Admin Paneli Giriş Sayfası (Basit bir örnek)
app.get('/admin', (req, res) => {
    res.render('admin_giris', { hata: null }); // admin_giris.ejs dosyanız olduğunu varsayalım
});

// Admin Paneli Giriş İşlemi
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM panel_kullanicilari WHERE kullanici_adi = ? AND sifre = ?', [username, password]);

        if (user && user.rol === config.panel.yetkiliRol) { // yetkiliRol'ü config objesinden al
            // Başarılı giriş, admin paneline yönlendir
            return res.redirect('/admin/dashboard');
        } else {
            return res.render('admin_giris', { hata: 'Geçersiz kullanıcı adı, şifre veya yetki!' });
        }
    } catch (err) {
        console.error('Admin girişi sırasında hata:', err);
        res.status(500).render('admin_giris', { hata: 'Giriş sırasında bir hata oluştu.' });
    }
});

// Admin Paneli Dashboard (basitçe)
app.get('/admin/dashboard', async (req, res) => {
    try {
        const db = await dbPromise;
        const kanunlar = await db.all('SELECT * FROM kanunlar ORDER BY id DESC');
        res.render('admin_dashboard', { kanunlar }); // admin_dashboard.ejs dosyanız olduğunu varsayalım
    } catch (err) {
        console.error("Admin paneli yüklenirken hata:", err);
        res.status(500).send("Admin paneli yüklenirken bir hata oluştu.");
    }
});


// Sunucuyu başlat
app.listen(port, () => {
    console.log(`🌐 Panel http://localhost:${port} adresinde çalışıyor.`);
});