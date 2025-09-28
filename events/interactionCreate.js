// events/interactionCreate.js (Güncellenmiş - Hata Kontrolleri Güçlendirildi)

import dbPromise from '../database/db.js'; // Veritabanı bağlantısı için ekledik

export default {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Slash Komutlarını İşleme
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`❌ Komut çalıştırılırken hata oluştu:`, error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({
                        content: '❌ Komut yürütülürken bir hata meydana geldi.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Komut yürütülürken bir hata meydana geldi.',
                        ephemeral: true
                    });
                }
            }
        }
        // Buton Etkileşimlerini İşleme
        else if (interaction.isButton()) {
            // customId kontrolü: Boş veya tanımsız olmaması ve beklenen formatla başlaması
            if (!interaction.customId || !interaction.customId.startsWith('oy_')) {
                // Beklenmeyen bir buton customId'si ise logla ve işlemi sonlandır.
                console.warn(`[UYARI] Beklenmeyen buton customId'si: ${interaction.customId || 'undefined'}`);
                return; // Burası önemli! İşlemi burada kesiyoruz.
            }

            const [action, type, kanunIdStr] = interaction.customId.split('_');
            const kanunId = parseInt(kanunIdStr, 10); // Kanun ID'sini sayıya dönüştür

            if (action === 'oy' && (type === 'evet' || type === 'hayir') && !isNaN(kanunId)) {
                const kullanici_id = interaction.user.id;
                const oy = type; // 'evet' veya 'hayir'

                try {
                    const db = await dbPromise; // Veritabanı bağlantısını al

                    // Kullanıcının daha önce oy kullanıp kullanmadığını kontrol et
                    const existingVote = await db.get(
                        `SELECT oy FROM oylar WHERE kanun_id = ? AND kullanici_id = ?`,
                        [kanunId, kullanici_id]
                    );

                    if (existingVote) {
                        if (existingVote.oy === oy) {
                            return interaction.reply({
                                content: `⚠️ Bu kanun için zaten **${oy.toUpperCase()}** oyu kullanmışsınız.`,
                                ephemeral: true
                            });
                        } else {
                            await db.run(
                                `UPDATE oylar SET oy = ? WHERE kanun_id = ? AND kullanici_id = ?`,
                                [oy, kanunId, kullanici_id]
                            );
                            return interaction.reply({
                                content: `✅ #${kanunId} ID'li kanun için oyunuz **${existingVote.oy.toUpperCase()}**'dan **${oy.toUpperCase()}** olarak değiştirildi.`,
                                ephemeral: true
                            });
                        }
                    }

                    // Kanunun varlığını ve durumunu kontrol et (sadece 'Oylamada' olanlar için oy verilebilir)
                    const kanun = await db.get(`SELECT id, durum FROM kanunlar WHERE id = ?`, [kanunId]);
                    if (!kanun) {
                        return interaction.reply({
                            content: '❌ Belirtilen ID’de bir kanun bulunamadı veya oylama bitmiş/silinmiş.',
                            ephemeral: true
                        });
                    }
                    if (kanun.durum !== 'Oylamada') {
                        return interaction.reply({
                            content: `❌ Bu kanunun oylaması şu anda **${kanun.durum}** durumunda olduğu için oy kullanılamaz.`,
                            ephemeral: true
                        });
                    }

                    // Yeni oy kaydetme işlemi
                    await db.run(`
                        INSERT INTO oylar (kanun_id, kullanici_id, oy)
                        VALUES (?, ?, ?)
                    `, [kanunId, kullanici_id, oy]);

                    await interaction.reply({
                        content: `✅ #${kanunId} ID'li kanun için oyunuz başarıyla kaydedildi: **${oy.toUpperCase()}**`,
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('❌ Oy kaydedilirken hata oluştu:', error);
                    if (interaction.deferred || interaction.replied) {
                        await interaction.followUp({
                            content: '❌ Oyunuzu kaydederken bir hata oluştu. Lütfen tekrar deneyin.',
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ Oyunuzu kaydederken bir hata oluştu. Lütfen tekrar deneyin.',
                            ephemeral: true
                        });
                    }
                }
            } else {
                console.warn(`[UYARI] Tanımsız buton customId formatı veya geçersiz kanun ID'si: ${interaction.customId}`);
            }
        }
    }
};