// commands/guvenlik-destek.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dbPromise from '../database/db.js';
import { isAuthorized } from '../utils/yetkiKontrol.js';
import config from '../config.js'; // config objesi olarak import edildi

export default {
    data: new SlashCommandBuilder()
        .setName('güvenlik-destek')
        .setDescription('İsyana karşı güvenlik güçlerinin desteğini sağlayarak memnuniyeti artırır ve isyanı bastırır.'),

    async execute(interaction) {
        const db = await dbPromise;
        const yetkiliRolId = config.roller.asker; // config objesinden alındı

        // Yetki Kontrolü
        const yetkili = isAuthorized(interaction.member, yetkiliRolId);
        if (!yetkili) {
            const yetkiliRolObj = interaction.guild.roles.cache.get(yetkiliRolId);
            const yetkiliRolAdi = yetkiliRolObj ? yetkiliRolObj.name : 'Asker';
            return interaction.reply({
                content: `⛔ Bu komutu sadece **${yetkiliRolAdi}** rolüne sahip olanlar kullanabilir.`,
                ephemeral: true
            });
        }

        try {
            const oyunDurumu = await db.get('SELECT memnuniyet_seviyesi, isyan_aktif FROM oyun_durumu WHERE id = 1');

            if (!oyunDurumu) {
                return interaction.reply({
                    content: '❌ Oyun durumu veritabanında bulunamadı. Lütfen yöneticinizle iletişime geçin.',
                    ephemeral: true
                });
            }

            let responseContent = '';
            let responseColor = config.renkler.bilgi; // config objesinden alındı

            await db.run(`
                UPDATE oyun_durumu
                SET memnuniyet_seviyesi = MIN(100, memnuniyet_seviyesi + 15)
                WHERE id = 1
            `);
            const updatedOyunDurumu = await db.get('SELECT memnuniyet_seviyesi, isyan_aktif FROM oyun_durumu WHERE id = 1');

            responseContent += `✅ Halkın memnuniyeti güvenlik desteğiyle artırıldı! Yeni memnuniyet seviyesi: **${updatedOyunDurumu.memnuniyet_seviyesi}%**\n`;

            if (oyunDurumu.isyan_aktif) {
                await db.run(`
                    UPDATE oyun_durumu
                    SET isyan_aktif = 0
                    WHERE id = 1
                `);
                responseContent += `🚨 Aktif isyan bastırıldı! Ülkede huzur tekrar sağlanıyor.`;
                responseColor = config.renkler.onay; // config objesinden alındı
            } else {
                responseContent += `➡️ Şu anda aktif bir isyan bulunmuyor. Bu destek halkın memnuniyetini daha da artırdı.`;
            }

            const embedMsg = new EmbedBuilder()
                .setTitle('🛡️ Güvenlik Desteği Sağlandı!')
                .setDescription(responseContent)
                .setColor(responseColor)
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail }) // config objesinden alındı
                .setTimestamp();

            await interaction.reply({ embeds: [embedMsg] });

        } catch (error) {
            console.error('❌ Güvenlik destek komutunda hata oluştu:', error);
            await interaction.reply({
                content: '❌ Güvenlik destek işlemi sırasında bir hata oluştu. Lütfen logları kontrol edin.',
                ephemeral: true
            });
        }
    }
};