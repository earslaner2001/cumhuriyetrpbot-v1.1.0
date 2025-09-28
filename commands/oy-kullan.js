// commands/oy-kullan.js
import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import dbPromise from '../database/db.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('oy-kullan')
        .setDescription('Bir kanun teklifi için oy kullanırsınız.')
        .addIntegerOption(option =>
            option.setName('kanun_id')
                .setDescription('Oy kullanmak istediğiniz kanun teklifinin ID’si')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('oy')
                .setDescription('Oyunuz (evet/hayır)')
                .setRequired(true)
                .addChoices(
                    { name: 'Evet', value: 'evet' },
                    { name: 'Hayır', value: 'hayır' },
                )),

    async execute(interaction) {
        console.log(`[OY-KULLAN] Komut çağrıldı. Kullanıcı: ${interaction.user.tag}, Kanun ID: ${interaction.options.getInteger('kanun_id')}`);
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        console.log(`[OY-KULLAN] DeferReply gönderildi.`);

        const kanunId = interaction.options.getInteger('kanun_id');
        const oy = interaction.options.getString('oy');
        const userId = interaction.user.id;
        const db = await dbPromise;

        try {
            console.log(`[OY-KULLAN] Veritabanından kanun kontrol ediliyor (ID: ${kanunId})...`);
            const kanun = await db.get(`SELECT * FROM kanunlar WHERE id = ?`, [kanunId]);
            console.log(`[OY-KULLAN] Kanun kontrol sonucu:`, kanun);

            if (!kanun) {
                console.log(`[OY-KULLAN] Kanun bulunamadı: ${kanunId}`);
                return interaction.editReply({ content: '❌ Belirtilen ID’de bir kanun teklifi bulunamadı.', flags: MessageFlags.Ephemeral });
            }

            if (kanun.durum !== 'Oylamada') {
                console.log(`[OY-KULLAN] Kanun oylamada değil. Mevcut durum: ${kanun.durum}`);
                return interaction.editReply({ content: `⚠️ Bu kanun teklifi şu anda "Oylamada" durumunda değil. Mevcut durumu: **${kanun.durum}**`, flags: MessageFlags.Ephemeral });
            }

            console.log(`[OY-KULLAN] Kullanıcının önceki oyu kontrol ediliyor (Kanun ID: ${kanunId}, Kullanıcı ID: ${userId})...`);
            const existingVote = await db.get(`SELECT * FROM oylar WHERE kanun_id = ? AND kullanici_id = ?`, [kanunId, userId]);
            console.log(`[OY-KULLAN] Önceki oy kontrol sonucu:`, existingVote);

            if (existingVote) {
                console.log(`[OY-KULLAN] Mevcut oy güncelleniyor...`);
                await db.run(`UPDATE oylar SET oy = ?, tarih = CURRENT_TIMESTAMP WHERE kanun_id = ? AND kullanici_id = ?`, [oy, kanunId, userId]);
                console.log(`[OY-KULLAN] Oy başarıyla güncellendi.`);
                await interaction.editReply({ content: `✅ #${kanunId} numaralı kanun teklifi için oyunuzu başarıyla "**${oy.toUpperCase()}**" olarak güncellediniz.`, flags: MessageFlags.Ephemeral });
            } else {
                console.log(`[OY-KULLAN] Yeni oy ekleniyor...`);
                await db.run(`INSERT INTO oylar (kanun_id, kullanici_id, oy, tarih) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`, [kanunId, userId, oy]);
                console.log(`[OY-KULLAN] Yeni oy başarıyla eklendi.`);
                await interaction.editReply({ content: `✅ #${kanunId} numaralı kanun teklifi için başarıyla "**${oy.toUpperCase()}**" oyu kullandınız.`, flags: MessageFlags.Ephemeral });
            }
            console.log(`[OY-KULLAN] Oy kullanma işlemi tamamlandı.`);

        } catch (error) {
            console.error('❌ [OY-KULLAN] Oy kullanma sırasında bir hata oluştu:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '❌ Oy kullanma sırasında bir hata oluştu. Lütfen logları kontrol edin.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [OY-KULLAN] Hata yanıtı gönderilirken de hata oluştu:", err));
            } else {
                // Bu kısım normalde deferReply olduğu için tetiklenmemeli,
                // ancak yine de bir fallback olarak tutulabilir.
                await interaction.reply({
                    content: '❌ Oy kullanma sırasında beklenmedik bir hata oluştu.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [OY-KULLAN] Hata yanıtı gönderilirken de hata oluştu:", err));
            }
        }
    }
};