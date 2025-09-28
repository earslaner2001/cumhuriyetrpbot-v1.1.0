// index.js

import { Client, GatewayIntentBits, Collection, ActivityType } from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';
import chalk from 'chalk';
import dbPromise from './database/db.js';
import { initializeDatabase } from './main.js'; // initializeDatabase'i import edin

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, // Mesaj içeriği okumak için
        GatewayIntentBits.MessageContent, // Mesaj içeriği okumak için
        GatewayIntentBits.GuildMembers,   // Üye bilgilerine erişim için
    ]
});
client.commands = new Collection();

// Komutlar
const commandFiles = fs.readdirSync('./commands');
for (const file of commandFiles) {
    const { default: command } = await import(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Eventler
const eventFiles = fs.readdirSync('./events');
for (const file of eventFiles) {
    const { default: event } = await import(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Botu Discord'a bağlamadan önce veritabanının başlatılmasını bekleyin
// Bu, tüm komutlar ve eventler için veritabanının hazır olmasını sağlar.
(async () => {
    await initializeDatabase(); // Veritabanı başlatma fonksiyonunu çağır
    console.log(chalk.yellow('🔄 Veritabanı başlatma/güncelleme tamamlandı.'));
    client.login(process.env.TOKEN);
})();


client.once('ready', async () => {
    console.log(chalk.green(`🔌 Bot başarıyla bağlandı: ${client.user.tag}`));

    const updatePresence = async () => {
        const db = await dbPromise; // Veritabanı bağlantısını bekle

        let memnuniyet_seviyesi = 'Bilinmiyor';
        let isyan_aktif = false;
        let kanunSayisi = 0;
        let oylamadaKanunSayisi = 0;

        try {
            const oyunDurumu = await db.get('SELECT memnuniyet_seviyesi, isyan_aktif FROM oyun_durumu WHERE id = 1');
            if (oyunDurumu) {
                memnuniyet_seviyesi = oyunDurumu.memnuniyet_seviyesi;
                isyan_aktif = oyunDurumu.isyan_aktif === 1;
            }

            const kanunlar = await db.all('SELECT durum FROM kanunlar');
            kanunSayisi = kanunlar.length;
            oylamadaKanunSayisi = kanunlar.filter(k => k.durum === 'Oylamada').length;

        } catch (error) {
            console.error('Veritabanından durum bilgileri çekilirken hata oluştu:', error);
            // Hata durumunda varsayılan değerler kullanılacak
        }

        const statuses = [
            { name: `🌐 ${client.guilds.cache.size} sunucuda!` },
            { name: `📜 ${kanunSayisi} kanun takip ediliyor.`, type: ActivityType.Watching },
            { name: `💡 ${oylamadaKanunSayisi} kanun oylamada!`, type: ActivityType.Playing },
            { name: `🗳️ Oy kullanmayı unutma!`, type: ActivityType.Custom },
            { name: `⚙️ Her şey yolunda!`, type: ActivityType.Watching },
            { name: `Oynuyor: Halkın refahı için çalışıyor.`, type: ActivityType.Playing },
            { name: `İzliyor: Ordunun hareketlerini.`, type: ActivityType.Watching },
            { name: `Dinliyor: Halkın sesini.`, type: ActivityType.Listening },
        ];

        if (memnuniyet_seviyesi !== 'Bilinmiyor') {
            statuses.push({ name: `😊 Memnuniyet: %${memnuniyet_seviyesi}`, type: ActivityType.Watching });
            if (memnuniyet_seviyesi < 50) {
                statuses.push({ name: `⚠️ Halk huzursuz!`, type: ActivityType.Playing });
            }
        }
        if (isyan_aktif) {
            statuses.push({ name: `🚨 İsyan aktif!`, type: ActivityType.Competing });
        }

        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        client.user.setPresence({
            activities: [{
                name: randomStatus.name,
                type: randomStatus.type || ActivityType.Custom,
            }],
            status: 'online',
        });

        console.log(chalk.blue(`✨ Bot durumu güncellendi: ${randomStatus.name}`));
    };

    // Bot hazır olduğunda ilk durumu ayarla
    await updatePresence();

    // Her 5 saniyede (5000 milisaniye) bir durumu güncelle
    setInterval(updatePresence, 5000);
});