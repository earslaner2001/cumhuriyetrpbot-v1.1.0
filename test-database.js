// Basit Database Test
import dbPromise from './database/db.js';

async function testDatabase() {
    console.log('🔍 Database bağlantı testi...');
    
    try {
        const db = await dbPromise;
        console.log('✅ Database bağlantısı başarılı');
        
        const users = await db.all('SELECT * FROM panel_kullanicilari');
        console.log('👥 Kullanıcılar:', users);
        
        // Spesifik kullanıcı kontrolü
        const adminUser = await db.get('SELECT * FROM panel_kullanicilari WHERE kullanici_adi = ? AND sifre = ?', ['admin', '123456']);
        console.log('🔐 Admin kullanıcı kontrolü:', adminUser);
        
        if (adminUser) {
            console.log('✅ Admin kullanıcı bulundu!');
            console.log('  - ID:', adminUser.id);
            console.log('  - Kullanıcı adı:', adminUser.kullanici_adi);
            console.log('  - Şifre:', adminUser.sifre);
            console.log('  - Rol:', adminUser.rol);
        } else {
            console.log('❌ Admin kullanıcı bulunamadı!');
        }
        
    } catch (error) {
        console.error('💥 Database hatası:', error);
    }
}

testDatabase();