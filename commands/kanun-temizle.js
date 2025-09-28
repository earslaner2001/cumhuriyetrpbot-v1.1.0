// commands/kanun-temizle.js
import pkg from 'discord.js';
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = pkg;

import dbPromise from '../database/db.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kanun-temizle')
        .setDescription('Belirli durumdaki veya tüm kanunları veritabanından siler. (DİKKAT: Kalıcıdır!)')
        .addStringOption(option =>
            option.setName('durum')
                .setDescription('Silinecek kanunların durumu (veya "hepsi")')
                .setRequired(true)
                .addChoices(
                    { name: 'Oylamada', value: 'Oylamada' },
                    { name: 'Yürürlükte', value: 'Yürürlükte' },
                    { name: 'Reddedildi', value: 'Reddedildi' },
                    { name: 'Taslak', value: 'Taslak' },
                    { name: 'Hepsi', value: 'hepsi' } // Tüm kanunları silme seçeneği
                ))
        .addStringOption(option =>
            option.setName('onayla')
                .setDescription('"hepsi" seçeneği için "evet" yazarak onaylayın')
                .setRequired(false)), // Sadece 'hepsi' seçeneği için zorunlu olacak

    async execute(interaction) {
        console.log(`[KANUN-TEMİZLE] Komut çağrıldı. Kullanıcı: ${interaction.user.tag}`);
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        console.log(`[KANUN-TEMİZLE] DeferReply gönderildi.`);

        const durum = interaction.options.getString('durum');
        const onayla = interaction.options.getString('onayla');
        const db = await dbPromise;

        // Yetki kontrolü (sadece Başkan rolünün bu komutu kullanmasına izin ver)
        const requiredRoleId = config.roller.başkan; // config.js dosyasından başkan rolü ID'si
        if (!interaction.member.roles.cache.has(requiredRoleId)) {
            console.log(`[KANUN-TEMİZLE] Yetki hatası: ${interaction.user.tag} gerekli role sahip değil.`);
            return interaction.editReply({
                content: `❌ Bu komutu kullanmak için <@&${requiredRoleId}> rolüne sahip olmanız gerekmektedir.`,
                flags: MessageFlags.Ephemeral
            });
        }
        console.log(`[KANUN-TEMİZLE] Yetki kontrolü başarılı.`);

        try {
            let deleteCount = 0;
            let deleteVotesCount = 0;
            let query;
            let params = [];
            let confirmationNeeded = false;
            let confirmationMessage = '';

            if (durum === 'hepsi') {
                confirmationNeeded = true;
                confirmationMessage = 'Tüm kanunlar ve ilgili oylar silinecek. Emin misiniz? Onaylamak için `/kanun-temizle durum:hepsi onayla:evet` şeklinde tekrar girin.';
                if (onayla !== 'evet') {
                    console.log(`[KANUN-TEMİZLE] Tüm kanunları silme onayı verilmedi.`);
                    return interaction.editReply({
                        content: `⚠️ **DİKKAT!** ${confirmationMessage}`,
                        flags: MessageFlags.Ephemeral
                    });
                }
                // Tüm kanunları silmeden önce ilgili oyları da silmeliyiz
                console.log(`[KANUN-TEMİZLE] Tüm kanunlar ve oylar siliniyor...`);

                const allKanunIdsResult = await db.all(`SELECT id FROM kanunlar`);
                const allKanunIds = allKanunIdsResult.map(row => row.id);

                if (allKanunIds.length > 0) {
                    await db.run(`DELETE FROM oylar WHERE kanun_id IN (${allKanunIds.map(() => '?').join(',')})`, allKanunIds);
                    deleteVotesCount = (await db.changes); // sqlite3 'changes' property for last statement
                    console.log(`[KANUN-TEMİZLE] ${deleteVotesCount} oy silindi.`);
                }

                query = `DELETE FROM kanunlar`;
            } else {
                console.log(`[KANUN-TEMİZLE] '${durum}' durumundaki kanunlar siliniyor...`);
                // Önce silinecek kanunların ID'lerini al
                const kanunIdsToDeleteResult = await db.all(`SELECT id FROM kanunlar WHERE durum = ?`, [durum]);
                const kanunIdsToDelete = kanunIdsToDeleteResult.map(row => row.id);

                if (kanunIdsToDelete.length > 0) {
                    // İlgili oyları sil
                    await db.run(`DELETE FROM oylar WHERE kanun_id IN (${kanunIdsToDelete.map(() => '?').join(',')})`, kanunIdsToDelete);
                    deleteVotesCount = (await db.changes);
                    console.log(`[KANUN-TEMİZLE] ${deleteVotesCount} oy silindi (durum: ${durum}).`);
                }

                query = `DELETE FROM kanunlar WHERE durum = ?`;
                params = [durum];
            }

            // Kanunları sil
            const result = await db.run(query, params);
            deleteCount = result.changes; // Silinen satır sayısı
            console.log(`[KANUN-TEMİZLE] ${deleteCount} kanun silindi.`);

            const embed = new EmbedBuilder()
                .setTitle(`🗑️ Kanun Temizleme Tamamlandı!`)
                .setDescription(`
                    **Durum:** ${durum === 'hepsi' ? 'Tüm kanunlar' : `"${durum}" durumundaki kanunlar`}
                    **Silinen Kanun Sayısı:** ${deleteCount}
                    **Silinen Oy Sayısı:** ${deleteVotesCount}
                    Bu işlem kalıcıdır ve geri alınamaz.
                `)
                .setColor(config.renkler.hata) // Uyarı veya hata rengi
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            console.log(`[KANUN-TEMİZLE] Yanıt başarıyla gönderildi.`);

        } catch (error) {
            console.error('❌ [KANUN-TEMİZLE] Komut çalıştırılırken bir hata oluştu:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '❌ Kanunları temizlerken bir hata oluştu. Lütfen logları kontrol edin.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [KANUN-TEMİZLE] Hata yanıtı gönderilirken de hata oluştu:", err));
            } else {
                await interaction.reply({
                    content: '❌ Kanunları temizlerken beklenmedik bir hata oluştu.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [KANUN-TEMİZLE] Hata yanıtı gönderilirken de hata oluştu:", err));
            }
        }
    }
};