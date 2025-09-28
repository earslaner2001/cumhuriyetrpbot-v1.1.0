// commands/kanun-durumu.js
import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import dbPromise from '../database/db.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kanun-durumu')
        .setDescription('Bir kanun teklifinin güncel durumunu ve detaylarını gösterir.')
        .addIntegerOption(option =>
            option.setName('kanun_id')
                .setDescription('Durumu görüntülenecek kanun teklifinin ID’si')
                .setRequired(true)),

    async execute(interaction) {
        console.log(`[KANUN-DURUMU] Komut çağrıldı. Kullanıcı: ${interaction.user.tag}, Kanun ID: ${interaction.options.getInteger('kanun_id')}`);
        // !!! EN ÖNEMLİ DEĞİŞİKLİK: ETKİLEŞİMİ HEMEN ERTELE !!!
        // ephemeral: false, komutun yanıtını herkesin görmesini sağlar.
        await interaction.deferReply({ ephemeral: false });
        console.log(`[KANUN-DURUMU] DeferReply gönderildi.`);

        const kanunId = interaction.options.getInteger('kanun_id');
        const db = await dbPromise;

        try {
            console.log(`[KANUN-DURUMU] Veritabanından kanun ve oy bilgileri sorgulanıyor (ID: ${kanunId})...`);
            const kanun = await db.get(`
                SELECT
                    k.id,
                    k.baslik,
                    k.icerik,
                    k.teklif_sahibi,
                    k.durum,
                    k.olusturma_tarihi AS zaman, -- Sütun adını olusturma_tarihi olarak güncelledik
                    k.yururluge_giris_sekli,
                    SUM(CASE WHEN o.oy = 'evet' THEN 1 ELSE 0 END) AS evet_oy,
                    SUM(CASE WHEN o.oy = 'hayır' THEN 1 ELSE 0 END) AS hayir_oy
                FROM kanunlar k
                LEFT JOIN oylar o ON k.id = o.kanun_id
                WHERE k.id = ?
                GROUP BY k.id
            `, [kanunId]);
            console.log(`[KANUN-DURUMU] Kanun sorgu sonucu:`, kanun);

            if (!kanun) {
                console.log(`[KANUN-DURUMU] Kanun bulunamadı: ${kanunId}`);
                return interaction.editReply({ content: '❌ Belirtilen ID’de bir kanun teklifi bulunamadı.', flags: MessageFlags.Ephemeral });
            }

            const durumText = kanun.durum === 'Yürürlükte' ?
                `**Yürürlükte** (${kanun.yururluge_giris_sekli || 'Bilinmiyor'})` :
                `**${kanun.durum}**`;

            const embed = new EmbedBuilder()
                .setTitle(`📜 Kanun Teklifi Durumu: #${kanun.id}`)
                .setDescription(`**Başlık:** ${kanun.baslik}\n**İçerik:** ${kanun.icerik}`)
                .addFields(
                    { name: 'Durum', value: durumText, inline: true },
                    { name: 'Teklif Sahibi', value: kanun.teklif_sahibi, inline: true },
                    { name: 'Oylar', value: `✅ ${kanun.evet_oy || 0} / ❌ ${kanun.hayir_oy || 0}`, inline: true },
                    { name: 'Oluşturulma Zamanı', value: `<t:${Math.floor(new Date(kanun.zaman).getTime() / 1000)}:f>`, inline: false }
                )
                .setColor(config.renkler.bilgi)
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail })
                .setTimestamp();

            console.log(`[KANUN-DURUMU] Embed oluşturuldu. Yanıt gönderiliyor...`);
            await interaction.editReply({ embeds: [embed] });
            console.log(`[KANUN-DURUMU] Yanıt başarıyla gönderildi.`);

        } catch (error) {
            console.error('❌ [KANUN-DURUMU] Kanun durumu sorgulanırken bir hata oluştu:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '❌ Kanun durumu sorgulanırken bir hata oluştu. Lütfen logları kontrol edin.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [KANUN-DURUMU] Hata yanıtı gönderilirken de hata oluştu:", err));
            } else {
                await interaction.reply({
                    content: '❌ Kanun durumu sorgulanırken beklenmedik bir hata oluştu.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [KANUN-DURUMU] Hata yanıtı gönderilirken de hata oluştu:", err));
            }
        }
    }
};