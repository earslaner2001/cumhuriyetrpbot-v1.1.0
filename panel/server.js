// panel/server.js
import express from 'express';
import session from 'express-session';
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
console.log('🔧 Express urlencoded middleware loaded');

// Session middleware
app.use(session({
    secret: 'cumhuriyet-bot-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 saat
}));
console.log('🍪 Session middleware loaded');
app.use(express.json()); // JSON verilerini işlemek için

// Test route
app.all('/test', (req, res) => {
    console.log('🧪 TEST ROUTE ÇALIŞTI! Method:', req.method);
    console.log('📥 Body:', req.body);
    res.json({ message: 'Test başarılı!', method: req.method, body: req.body });
});

// Ana sayfa
app.get('/', async (req, res) => {
    try {
        const db = await dbPromise; // Veritabanı bağlantısını al
        const kanunlar = await db.all('SELECT * FROM kanunlar ORDER BY id DESC');
        
        // Zaman alanını düzgün formatla
        const formattedKanunlar = kanunlar.map(kanun => ({
            ...kanun,
            zaman: kanun.zaman || kanun.olusturma_tarihi
        }));
        
        res.render('index', { 
            kanunlar: formattedKanunlar, 
            footer: config.embed.footer, 
            thumbnail: config.embed.thumbnail 
        });
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
    // Eğer zaten giriş yapılmışsa dashboard'a yönlendir
    if (req.session.admin) {
        console.log('✅ Zaten giriş yapılmış, dashboard\'a yönlendiriliyor');
        return res.redirect('/admin/dashboard');
    }
    
    console.log('📝 Admin giriş sayfası görüntüleniyor');
    res.render('admin_giris', { hata: null }); // admin_giris.ejs dosyanız olduğunu varsayalım
});

// Admin Paneli Giriş İşlemi
app.post('/admin/login', async (req, res) => {
    console.log('🚀🚀🚀 POST /admin/login route ÇALIŞTI! 🚀🚀🚀');
    console.log('📥 req.body:', req.body);
    
    const { username, password } = req.body;
    console.log('🔐 Giriş denemesi:', { username: username, password: password }); // Debug için
    
    try {
        const db = await dbPromise;
        console.log('📊 Veritabanı bağlantısı başarılı');
        
        const user = await db.get('SELECT * FROM panel_kullanicilari WHERE kullanici_adi = ? AND sifre = ?', [username, password]);
        console.log('� Bulunan kullanıcı:', user); // Debug için

        if (user && (user.rol === 'admin' || user.rol === 'moderator')) { // Admin veya moderator rolü kabul et
            // Session'a kullanıcı bilgilerini kaydet
            req.session.admin = {
                id: user.id,
                username: user.kullanici_adi,
                rol: user.rol
            };
            console.log('✅ Giriş başarılı! Dashboard\'a yönlendiriliyor...');
            return res.redirect('/admin/dashboard');
        } else {
            console.log('❌ Giriş başarısız! Kullanıcı bulunamadı veya yetki yok.');
            return res.render('admin_giris', { hata: 'Geçersiz kullanıcı adı, şifre veya yetki!' });
        }
    } catch (err) {
        console.error('💥 Admin girişi sırasında hata:', err);
        res.status(500).render('admin_giris', { hata: 'Giriş sırasında bir hata oluştu.' });
    }
});

// Admin Paneli Dashboard (basitçe)
app.get('/admin/dashboard', async (req, res) => {
    // Session kontrolü - eğer giriş yapılmamışsa admin giriş sayfasına yönlendir
    if (!req.session.admin) {
        console.log('❌ Dashboard erişimi reddedildi - session yok');
        return res.redirect('/admin');
    }
    
    console.log('✅ Dashboard erişimi - Session:', req.session.admin);
    
    try {
        const db = await dbPromise;
        const kanunlar = await db.all('SELECT * FROM kanunlar ORDER BY id DESC');
        
        // Zaman alanını düzgün formatla
        const formattedKanunlar = kanunlar.map(kanun => ({
            ...kanun,
            zaman: kanun.zaman || kanun.olusturma_tarihi
        }));
        
        // Oyun durumu bilgisi de ekleyelim
        const oyunDurumu = await db.get('SELECT * FROM oyun_durumu WHERE id = 1');
        
        // Oyları getir
        const oylar = await db.all('SELECT * FROM oylar');
        const evetOyları = oylar.filter(oy => oy.oy === 'evet').length;
        const hayırOyları = oylar.filter(oy => oy.oy === 'hayır').length;
        
        res.render('admin_dashboard', { 
            kanunlar: formattedKanunlar,
            oyunDurumu: oyunDurumu || { memnuniyet_seviyesi: 75, isyan_aktif: 0 },
            oylar,
            evetOyları,
            hayırOyları
        });
    } catch (err) {
        console.error("Admin paneli yüklenirken hata:", err);
        res.status(500).send("Admin paneli yüklenirken bir hata oluştu.");
    }
});

// Admin Logout
app.post('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout hatası:', err);
        }
        res.redirect('/admin');
    });
});


// Sunucuyu başlat
app.listen(port, () => {
    console.log(`🌐 Panel http://localhost:${port} adresinde çalışıyor.`);
});