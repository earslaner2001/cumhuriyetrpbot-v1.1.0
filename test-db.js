// test-db.js
import dbPromise from './database/db.js';

(async () => {
  try {
    const db = await dbPromise;
    console.log('📊 Mevcut tablolar:');
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    tables.forEach(table => console.log('  -', table.name));
    
    console.log('\n📋 Kanunlar tablosu:');
    const kanunlar = await db.all('SELECT * FROM kanunlar LIMIT 3');
    console.log(kanunlar);
    
    console.log('\n🗳️ Oylar tablosu:');
    const oylar = await db.all('SELECT * FROM oylar LIMIT 3');
    console.log(oylar);
    
    console.log('\n👥 Panel kullanıcıları:');
    const users = await db.all('SELECT * FROM panel_kullanicilari');
    console.log(users);
    
    console.log('\n🎮 Oyun durumu:');
    const oyunDurumu = await db.all('SELECT * FROM oyun_durumu');
    console.log(oyunDurumu);
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
})();