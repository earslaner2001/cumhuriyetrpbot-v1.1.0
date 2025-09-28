// commands/kanun-sifirla.js
import pkg from 'discord.js';
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = pkg;

import dbPromise from '../database/db.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kanun-sifirla')
        .setDescription('Bir kanun teklifini taslak durumuna geri döndürür ve oylarını sıfırlar.')
        .addIntegerOption(option =>
            option.setName('kanun_id')
                .setDescription('Sıfırlanacak kanun teklifinin ID’si')
                .setRequired(true)),

    async execute(interaction) {
        console.log(`[KANUN-SIFIRLA] Komut çağrıldı. Kullanıcı: ${interaction.user.tag}, Kanun ID: ${interaction.options.getInteger('kanun_id')}`);
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        console.log(`[KANUN-SIFIRLA] DeferReply gönderildi.`);

        const kanunId = interaction.options.getInteger('kanun_id');
        const userId = interaction.user.id;
        const db = await dbPromise;

        // Yetki kontrolü (sadece belirli bir rolün bu komutu kullanmasına izin ver)
        // Lütfen bu kısmı kendi yetkili rolünüzün ID'si ile güncelleyin.
        const requiredRoleId = '920832297199087677'; // Buraya yetkili rolünün ID'sini girin
        if (!interaction.member.roles.cache.has(requiredRoleId)) {
            console.log(`[KANUN-SIFIRLA] Yetki hatası: ${interaction.user.tag} gerekli role sahip değil.`);
            return interaction.editReply({
                content: '❌ Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.',
                flags: MessageFlags.Ephemeral
            });
        }
        console.log(`[KANUN-SIFIRLA] Yetki kontrolü başarılı.`);

        try {
            console.log(`[KANUN-SIFIRLA] Veritabanından kanun kontrol ediliyor (ID: ${kanunId})...`);
            const kanun = await db.get(`SELECT * FROM kanunlar WHERE id = ?`, [kanunId]);
            console.log(`[KANUN-SIFIRLA] Kanun kontrol sonucu:`, kanun);

            if (!kanun) {
                console.log(`[KANUN-SIFIRLA] Kanun bulunamadı: ${kanunId}`);
                return interaction.editReply({ content: '❌ Belirtilen ID’de bir kanun teklifi bulunamadı.', flags: MessageFlags.Ephemeral });
            }

            // Kanunun durumunu 'Taslak' olarak güncelle
            console.log(`[KANUN-SIFIRLA] Kanun durumu 'Taslak' olarak güncelleniyor...`);
            await db.run(`UPDATE kanunlar SET durum = 'Taslak', yururluge_giris_sekli = NULL WHERE id = ?`, [kanunId]);
            console.log(`[KANUN-SIFIRLA] Kanun durumu güncellendi.`);

            // Kanunla ilgili tüm oyları sil
            console.log(`[KANUN-SIFIRLA] Kanuna ait tüm oylar siliniyor...`);
            await db.run(`DELETE FROM oylar WHERE kanun_id = ?`, [kanunId]);
            console.log(`[KANUN-SIFIRLA] Oylar başarıyla silindi.`);

            const embed = new EmbedBuilder()
                .setTitle(`✅ Kanun Teklifi Sıfırlandı: #${kanunId}`)
                .setDescription(`
                    **Başlık:** ${kanun.baslik}
                    **Teklif Sahibi:** ${kanun.teklif_sahibi}
                    Bu kanun teklifi başarıyla **Taslak** durumuna geri döndürüldü ve tüm oyları sıfırlandı.
                `)
                .setColor(config.renkler.bilgi) // Bilgi için mavi renk
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail })
                .setTimestamp();

            console.log(`[KANUN-SIFIRLA] Embed oluşturuldu. Yanıt gönderiliyor...`);
            await interaction.editReply({ embeds: [embed] });
            console.log(`[KANUN-SIFIRLA] Yanıt başarıyla gönderildi.`);

        } catch (error) {
            console.error('❌ [KANUN-SIFIRLA] Komut çalıştırılırken bir hata oluştu:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '❌ Kanun sıfırlama sırasında bir hata oluştu. Lütfen logları kontrol edin.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [KANUN-SIFIRLA] Hata yanıtı gönderilirken de hata oluştu:", err));
            } else {
                await interaction.reply({
                    content: '❌ Kanun sıfırlama sırasında beklenmedik bir hata oluştu.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [KANUN-SIFIRLA] Hata yanıtı gönderilirken de hata oluştu:", err));
            }
        }
    }
};