// commands/kanun-listele.js
import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js'; // MessageFlags'i ekleyin!
import dbPromise from '../database/db.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kanun-listele')
        .setDescription('Yürürlükteki ve bekleyen kanunları detaylarıyla listeler'),

    async execute(interaction) {
        // EN BAŞA EKLE: Etkileşimi hemen ertele
        await interaction.deferReply({ ephemeral: false }); // Bu komut herkesin görmesi için olmalı, o yüzden ephemeral: false

        const db = await dbPromise;

        try {
            const rows = await db.all(`
                SELECT
                    k.id,
                    k.baslik,
                    k.icerik,
                    k.teklif_sahibi,
                    k.durum,
                    k.zaman,
                    k.yururluge_giris_sekli,
                    SUM(CASE WHEN o.oy = 'evet' THEN 1 ELSE 0 END) AS evet_oy,
                    SUM(CASE WHEN o.oy = 'hayır' THEN 1 ELSE 0 END) AS hayir_oy
                FROM kanunlar k
                LEFT JOIN oylar o ON k.id = o.kanun_id
                GROUP BY k.id
                ORDER BY k.id DESC
            `);

            if (!rows.length) {
                // deferReply yapıldığı için editReply kullanıyoruz
                return interaction.editReply({
                    content: '❌ Hiç kanun bulunamadı.',
                    flags: MessageFlags.Ephemeral // Yeni kullanım
                });
            }

            const embedMsg = new EmbedBuilder()
                .setTitle('📜 Kanunlar Listesi')
                .setColor(config.renkler.bilgi)
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail })
                .setTimestamp();

            for (const row of rows) {
                const durumText = row.durum === 'Yürürlükte' ?
                    `**Yürürlükte** (${row.yururluge_giris_sekli || 'Bilinmiyor'})` :
                    `**${row.durum}**`;

                embedMsg.addFields({
                    name: `#${row.id} - ${row.baslik}`,
                    value: `
                        **Durum:** ${durumText}
                        **Teklif Sahibi:** ${row.teklif_sahibi}
                        **Oylar:** ✅ ${row.evet_oy || 0} / ❌ ${row.hayir_oy || 0}
                        **Oluşturulma:** <t:${Math.floor(new Date(row.zaman).getTime() / 1000)}:f>
                    `,
                    inline: false
                });
            }

            // deferReply yapıldığı için editReply kullanıyoruz
            await interaction.editReply({ embeds: [embedMsg] });

        } catch (err) {
            console.error('❌ Kanunlar listelenirken bir hata oluştu:', err);
            // Hata durumunda da editReply kullanıyoruz
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '❌ Kanunları listelerken bir hata oluştu. Lütfen logları kontrol edin.',
                    flags: MessageFlags.Ephemeral // Yeni kullanım
                }).catch(error => console.error("Hata yanıtı gönderilirken de hata oluştu:", error));
            } else {
                await interaction.reply({
                    content: '❌ Kanunları listelerken beklenmedik bir hata oluştu.',
                    flags: MessageFlags.Ephemeral // Yeni kullanım
                }).catch(error => console.error("Hata yanıtı gönderilirken de hata oluştu:", error));
            }
        }
    }
};