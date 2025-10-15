// commands/kanun-teklifi.js
import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js'; // MessageFlags'i ekleyin!
import dbPromise from '../database/db.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kanun-teklifi')
        .setDescription('Yeni bir kanun teklifi sunar.')
        .addStringOption(option =>
            option.setName('baslik')
                .setDescription('Kanun teklifinin başlığı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('icerik')
                .setDescription('Kanun teklifinin içeriği')
                .setRequired(true)),

    async execute(interaction) {
        // EN BAŞA EKLE: Etkileşimi hemen ertele (Discord'a 'Aldım' sinyali ver)
        await interaction.deferReply({ ephemeral: false }); // Veya `flags: MessageFlags.Ephemeral` eğer sadece kullanıcı görsün isterseniz

        const baslik = interaction.options.getString('baslik');
        const icerik = interaction.options.getString('icerik');
        const teklifSahibi = interaction.user.tag;
        const db = await dbPromise;

        try {
            const result = await db.run(`
    INSERT INTO kanunlar (baslik, icerik, teklif_sahibi, durum, olusturma_tarihi)
    VALUES (?, ?, ?, 'Oylamada', CURRENT_TIMESTAMP)
`, [baslik, icerik, teklifSahibi]);

            const kanunId = result.lastID;

            const embedMsg = new EmbedBuilder()
                .setTitle('📜 Yeni Kanun Teklifi Sunuldu!')
                .setDescription(`
                    **Başlık:** ${baslik}
                    **İçerik:** ${icerik}
                    **Teklif Sahibi:** ${teklifSahibi}
                    **Durum:** Oylamada
                    **Kanun ID:** #${kanunId}
                `)
                .setColor(config.renkler.onay)
                .setFooter({ text: `${config.embed.footer} • v${config.version}`, iconURL: config.embed.thumbnail })
                .setTimestamp();

            // deferReply yapıldığı için artık editReply kullanıyoruz
            await interaction.editReply({ embeds: [embedMsg] });

        } catch (error) {
            console.error('❌ Kanun teklifi gönderilirken hata oluştu:', error);
            // Hata durumunda da editReply kullanmalıyız.
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '❌ Kanun teklifi gönderilirken bir hata oluştu. Lütfen logları kontrol edin.',
                    flags: MessageFlags.Ephemeral // Yeni kullanım
                }).catch(err => console.error("Hata yanıtı gönderilirken de hata oluştu:", err));
            } else {
                // Bu durum normalde deferReply kullandığımız için tetiklenmemeli, ancak önlem olarak kalsın.
                await interaction.reply({
                    content: '❌ Kanun teklifi gönderilirken beklenmedik bir hata oluştu.',
                    flags: MessageFlags.Ephemeral // Yeni kullanım
                }).catch(err => console.error("Hata yanıtı gönderilirken de hata oluştu:", err));
            }
        }
    }
};