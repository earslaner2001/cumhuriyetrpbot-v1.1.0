// commands/isyan.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dbPromise from '../database/db.js';
import config from '../config.js'; // config objesi olarak import edildi

export default {
    data: new SlashCommandBuilder()
        .setName('isyan')
        .setDescription('Halk memnuniyetsizse bir isyan başlatır.'),

    async execute(interaction) {
        const db = await dbPromise;

        try {
            const oyunDurumu = await db.get('SELECT memnuniyet_seviyesi, isyan_aktif FROM oyun_durumu WHERE id = 1');

            if (!oyunDurumu) {
                return interaction.reply({
                    content: '❌ Oyun durumu veritabanında bulunamadı. Lütfen yöneticinizle iletişime geçin.',
                    ephemeral: true
                });
            }

            const { memnuniyet_seviyesi, isyan_aktif } = oyunDurumu;

            if (isyan_aktif) {
                return interaction.reply({
                    content: '⚠️ Zaten bir isyan devam ediyor! Daha fazla kaos yaratılamaz.',
                    ephemeral: true
                });
            }

            const isyanEşigi = 40;
            if (memnuniyet_seviyesi >= isyanEşigi) {
                return interaction.reply({
                    content: `🕊️ Halk henüz isyan için yeterince memnuniyetsiz değil. Mevcut memnuniyet seviyesi: **${memnuniyet_seviyesi}%**. (İsyan için %${isyanEşigi} altı gerekli)`,
                    ephemeral: true
                });
            }

            await db.run(`
                UPDATE oyun_durumu
                SET isyan_aktif = 1, son_isyan_tarihi = CURRENT_TIMESTAMP
                WHERE id = 1
            `);

            const embedMsg = new EmbedBuilder()
                .setTitle('🚨 İsyan Başladı!')
                .setDescription(`
                    Halkın memnuniyetsizliği isyana dönüştü! Ülkede kaos ortamı hakim.
                    Mevcut memnuniyet seviyesi: **${memnuniyet_seviyesi}%**
                    İsyanı başlatan: ${interaction.user.tag}
                `)
                .setColor(config.renkler.red) // config objesinden alındı
                .setFooter({ text: `${config.embed.footer} • v${config.version}`, iconURL: config.embed.thumbnail }) // config objesinden alındı
                .setTimestamp();

            await interaction.reply({ embeds: [embedMsg] });

        } catch (error) {
            console.error('❌ İsyan komutu çalıştırılırken hata oluştu:', error);
            await interaction.reply({
                content: '❌ İsyan başlatılırken bir hata oluştu. Lütfen logları kontrol edin.',
                ephemeral: true
            });
        }
    }
};