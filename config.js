// config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
    token: process.env.TOKEN || 'YOUR_BOT_TOKEN_HERE', // .env dosyasından okunacak
    clientId: process.env.CLIENT_ID || 'YOUR_CLIENT_ID_HERE', // .env dosyasından okunacak
    guildId: process.env.GUILD_ID || 'YOUR_GUILD_ID_HERE', // Botun çalışacağı sunucunun ID'si (genellikle .env'den alınır)
    prefix: '/',

    // **ÖNEMLİ:** Bu rol ID'lerini kendi Discord sunucunuzdaki gerçek rol ID'leriyle DEĞİŞTİRİN.
    // Rol ID'sini almak için: Discord'da Geliştirici Modu'nu açın (Ayarlar > Gelişmiş),
    // sonra sunucunuzdaki bir role sağ tıklayıp "ID'yi Kopyala" seçeneğiyle alın.
    roller: {
        başkan: '920832283945087077',       // Örnek: '123456789012345678'
        bakan: '920832290555306054',       // Örnek: '123456789012345679'
        asker: '920832312701231256',       // Örnek: '123456789012345680'
        milletvekili: '920832291423551530', // Örnek: '123456789012345681'
        halk: '920832316841029672'         // Örnek: '123456789012345682'
    },

    // YENİ EKLENEN: Tüm komutları kullanabilecek süper yönetici rolünün ID'si
    // Bu rol ID'sini de kendi sunucunuzdan alın.
    adminRoleId: '920832297199087677', // Örneğin: '123456789012345670'

    renkler: {
        onay: '#4caf50',
        red: '#f44336',
        hata: '#f44336', // BURAYI EKLENDİM: Hata mesajları için kırmızı renk
        bilgi: '#2196f3',
        nötr: '#ffc107',
        uyari: '#FFC107' // Uyarı rengi
    },
    embed: {
        footer: 'CumhuriyetBot v1.0 • © 2025',
        thumbnail: 'https://i.imgur.com/BuRxA3L.png'
    },
    panel: {
        port: 3000,
        yetkiliRol: '920832297199087677' // Panel için yetkili rol ID'si. Örnek: '123456789012345690'
    }
};