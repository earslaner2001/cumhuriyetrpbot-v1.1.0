// deploy-commands.js
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url'; // pathToFileURL eklendi
import config from './config.js'; // config objesini default import olarak al

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
// commands klasöründeki tüm komut dosyalarını al
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // pathToFileURL ile doğru URL formatı oluşturuldu
    const { default: command } = await import(pathToFileURL(filePath).href);
    if (command.data) {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`[UYARI] ${file} dosyasında 'data' özelliği eksik olan bir komut bulundu.`);
    }
}

// REST modülü ve bot tokeni ile bir REST instance oluştur
const rest = new REST({ version: '10' }).setToken(config.token);

// Komutları Discord'a dağıt
(async () => {
    try {
        console.log(`⚡ ${commands.length} adet uygulama (/) komutu yenilenmeye başlanıyor.`);

        // Sunucuya özel komutları dağıtma (global yerine belirli bir sunucu için)
        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );

        console.log(`✅ ${data.length} adet uygulama (/) komutu başarıyla yüklendi.`);
    } catch (error) {
        // Hata yakalama
        console.error('❌ Komutlar yüklenirken bir hata oluştu:', error);
    }
})();