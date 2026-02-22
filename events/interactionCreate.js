// events/interactionCreate.js (Güncellenmiş - Hata Kontrolleri Güçlendirildi)

import dbPromise from '../database/db.js'; // Veritabanı bağlantısı için ekledik
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import config from '../config.js';

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
            const customId = interaction.customId;

            // Vatandaşlık Başvuru Butonu
            if (customId === 'vatandaslik_basvuru') {
                // Modal oluştur
                const modal = new ModalBuilder()
                    .setCustomId('vatandaslik_modal')
                    .setTitle('🏛️ Üyelik Başvuru Formu');

                // İsim input
                const isimInput = new TextInputBuilder()
                    .setCustomId('isim')
                    .setLabel('Adınız veya Nasıl Çağrılmak İstersiniz?')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Örnek: Ahmet, Mehmet, vb.')
                    .setRequired(true)
                    .setMaxLength(50);

                // Yaş input
                const yasInput = new TextInputBuilder()
                    .setCustomId('yas')
                    .setLabel('Yaşınız (Opsiyonel - Belirtmek İsterseniz)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Örnek: 25 (boş bırakabilirsiniz)')
                    .setRequired(false)
                    .setMaxLength(3);

                // Sebep input
                const sebepInput = new TextInputBuilder()
                    .setCustomId('sebep')
                    .setLabel('Kendinizi Kısaca Tanıtın')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Hobileriniz, ilgi alanlarınız veya sunucuya neden katılmak istediğiniz...')
                    .setRequired(true)
                    .setMinLength(20)
                    .setMaxLength(500);

                // Action rows oluştur
                const row1 = new ActionRowBuilder().addComponents(isimInput);
                const row2 = new ActionRowBuilder().addComponents(yasInput);
                const row3 = new ActionRowBuilder().addComponents(sebepInput);

                modal.addComponents(row1, row2, row3);

                await interaction.showModal(modal);
                return;
            }

            // Vatandaşlık Onay Butonu
            if (customId.startsWith('vatandaslik_onayla_')) {
                const basvuruId = customId.split('_')[2];
                const db = await dbPromise;

                try {
                    // Başvuru bilgilerini al
                    const basvuru = await db.get(
                        'SELECT * FROM vatandaslik_basvurulari WHERE id = ?',
                        [basvuruId]
                    );

                    if (!basvuru) {
                        return interaction.reply({
                            content: '❌ Başvuru bulunamadı!',
                            ephemeral: true
                        });
                    }

                    if (basvuru.durum !== 'Beklemede') {
                        return interaction.reply({
                            content: `⚠️ Bu başvuru zaten işleme alınmış! Durum: **${basvuru.durum}**`,
                            ephemeral: true
                        });
                    }

                    // Başvuruyu onayla
                    await db.run(
                        'UPDATE vatandaslik_basvurulari SET durum = ?, islem_tarihi = datetime("now"), islem_yapan = ? WHERE id = ?',
                        ['Onaylandı', interaction.user.tag, basvuruId]
                    );

                    // Kullanıcıya rol ver
                    const guild = interaction.guild;
                    const member = await guild.members.fetch(basvuru.kullanici_id).catch(() => null);
                    
                    if (member) {
                        const halkRole = guild.roles.cache.get(config.roller.halk);
                        if (halkRole) {
                            await member.roles.add(halkRole);
                            
                            // Kullanıcıya DM gönder
                            try {
                                await member.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(config.renkler.onay)
                                            .setTitle('🎉 Üyelik Başvurunuz Onaylandı!')
                                            .setDescription(
                                                `Tebrikler! **${guild.name}** sunucusuna üye olarak kabul edildiniz.\n\n` +
                                                `Artık tüm odalara erişim sağlayabilir ve topluluğa katılabilirsiniz.\n\n` +
                                                `İyi eğlenceler! 🏛️`
                                            )
                                            .setFooter({ text: config.embed.footer })
                                            .setTimestamp()
                                    ]
                                });
                            } catch (dmError) {
                                console.log('DM gönderilemedi:', dmError);
                            }

                            await interaction.update({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(config.renkler.onay)
                                        .setTitle('✅ Başvuru Onaylandı')
                                        .setDescription(
                                            `**Başvuran:** <@${basvuru.kullanici_id}> (${basvuru.kullanici_tag})\n` +
                                            `**İsim/Takma Ad:** ${basvuru.isim}\n` +
                                            `**Yaş:** ${basvuru.yas || 'Belirtilmemiş'}\n` +
                                            `**Tanıtım:** ${basvuru.sebep}\n\n` +
                                            `**✅ Durum:** Onaylandı\n` +
                                            `**İşlemi Yapan:** ${interaction.user.tag}\n` +
                                            `**İşlem Zamanı:** <t:${Math.floor(Date.now() / 1000)}:F>`
                                        )
                                        .setFooter({ text: config.embed.footer })
                                        .setTimestamp()
                                ],
                                components: [] // Butonları kaldır
                            });
                        } else {
                            return interaction.reply({
                                content: '❌ Halk rolü bulunamadı! Lütfen config.js dosyasını kontrol edin.',
                                ephemeral: true
                            });
                        }
                    } else {
                        return interaction.reply({
                            content: '❌ Kullanıcı sunucuda bulunamadı!',
                            ephemeral: true
                        });
                    }

                } catch (error) {
                    console.error('Başvuru onaylanırken hata:', error);
                    await interaction.reply({
                        content: '❌ Başvuru onaylanırken bir hata oluştu!',
                        ephemeral: true
                    });
                }
                return;
            }

            // Vatandaşlık Red Butonu
            if (customId.startsWith('vatandaslik_reddet_')) {
                const basvuruId = customId.split('_')[2];
                const db = await dbPromise;

                try {
                    // Başvuru bilgilerini al
                    const basvuru = await db.get(
                        'SELECT * FROM vatandaslik_basvurulari WHERE id = ?',
                        [basvuruId]
                    );

                    if (!basvuru) {
                        return interaction.reply({
                            content: '❌ Başvuru bulunamadı!',
                            ephemeral: true
                        });
                    }

                    if (basvuru.durum !== 'Beklemede') {
                        return interaction.reply({
                            content: `⚠️ Bu başvuru zaten işleme alınmış! Durum: **${basvuru.durum}**`,
                            ephemeral: true
                        });
                    }

                    // Başvuruyu reddet
                    await db.run(
                        'UPDATE vatandaslik_basvurulari SET durum = ?, islem_tarihi = datetime("now"), islem_yapan = ? WHERE id = ?',
                        ['Reddedildi', interaction.user.tag, basvuruId]
                    );

                    // Kullanıcıya DM gönder
                    const guild = interaction.guild;
                    const member = await guild.members.fetch(basvuru.kullanici_id).catch(() => null);
                    
                    if (member) {
                        try {
                            await member.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(config.renkler.red)
                                        .setTitle('❌ Üyelik Başvurunuz Reddedildi')
                                        .setDescription(
                                            `Üzgünüz, **${guild.name}** sunucusuna üyelik başvurunuz reddedildi.\n\n` +
                                            `Daha sonra tekrar başvurabilirsiniz.`
                                        )
                                        .setFooter({ text: config.embed.footer })
                                        .setTimestamp()
                                ]
                            });
                        } catch (dmError) {
                            console.log('DM gönderilemedi:', dmError);
                        }
                    }

                    await interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(config.renkler.red)
                                .setTitle('❌ Başvuru Reddedildi')
                                .setDescription(
                                    `**Başvuran:** <@${basvuru.kullanici_id}> (${basvuru.kullanici_tag})\n` +
                                    `**İsim/Takma Ad:** ${basvuru.isim}\n` +
                                    `**Yaş:** ${basvuru.yas || 'Belirtilmemiş'}\n` +
                                    `**Tanıtım:** ${basvuru.sebep}\n\n` +
                                    `**❌ Durum:** Reddedildi\n` +
                                    `**İşlemi Yapan:** ${interaction.user.tag}\n` +
                                    `**İşlem Zamanı:** <t:${Math.floor(Date.now() / 1000)}:F>`
                                )
                                .setFooter({ text: config.embed.footer })
                                .setTimestamp()
                        ],
                        components: [] // Butonları kaldır
                    });

                } catch (error) {
                    console.error('Başvuru reddedilirken hata:', error);
                    await interaction.reply({
                        content: '❌ Başvuru reddedilirken bir hata oluştu!',
                        ephemeral: true
                    });
                }
                return;
            }

            // Oy kullanma butonları kontrolü
            if (!customId || !customId.startsWith('oy_')) {
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
        // Modal Submit İşlemleri
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'vatandaslik_modal') {
                const db = await dbPromise;
                
                // Form verilerini al
                const isim = interaction.fields.getTextInputValue('isim');
                const yas = interaction.fields.getTextInputValue('yas');
                const sebep = interaction.fields.getTextInputValue('sebep');

                try {
                    // Yaş kontrolü (opsiyonel, sadece girilmişse kontrol et)
                    if (yas && yas.trim()) {
                        const yasNum = parseInt(yas, 10);
                        if (isNaN(yasNum) || yasNum < 13 || yasNum > 100) {
                            return interaction.reply({
                                content: '❌ Geçersiz yaş! Lütfen 13-100 arasında bir sayı girin veya boş bırakın.',
                                ephemeral: true
                            });
                        }
                    }

                    // Daha önce başvuru yapılıp yapılmadığını kontrol et
                    const existingBasvuru = await db.get(
                        'SELECT * FROM vatandaslik_basvurulari WHERE kullanici_id = ? AND durum = ?',
                        [interaction.user.id, 'Beklemede']
                    );

                    if (existingBasvuru) {
                        return interaction.reply({
                            content: '⚠️ Zaten beklemede olan bir başvurunuz var! Lütfen onaylanmasını bekleyin.',
                            ephemeral: true
                        });
                    }

                    // Başvuruyu veritabanına kaydet
                    const result = await db.run(
                        'INSERT INTO vatandaslik_basvurulari (kullanici_id, kullanici_tag, isim, yas, sebep) VALUES (?, ?, ?, ?, ?)',
                        [interaction.user.id, interaction.user.tag, isim, yas, sebep]
                    );

                    const basvuruId = result.lastID;

                    // Yöneticilere bildirim gönder
                    const adminChannel = interaction.guild.channels.cache.find(
                        ch => ch.name.includes('yönetici') || ch.name.includes('admin') || ch.name.includes('log')
                    );

                    if (adminChannel) {
                        const basvuruEmbed = new EmbedBuilder()
                            .setColor(config.renkler.bilgi)
                            .setTitle('📋 Yeni Üyelik Başvurusu')
                            .setDescription(`<@${interaction.user.id}> yeni bir üyelik başvurusu yaptı!`)
                            .addFields(
                                { name: '👤 Başvuran', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                                { name: '🆔 Başvuru ID', value: `#${basvuruId}`, inline: true },
                                { name: '📝 İsim/Takma Ad', value: isim, inline: false },
                                { name: '🎂 Yaş', value: yas && yas.trim() ? yas : 'Belirtilmemiş', inline: true },
                                { name: '📅 Başvuru Tarihi', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                                { name: '💭 Tanıtım', value: sebep, inline: false }
                            )
                            .setThumbnail(interaction.user.displayAvatarURL())
                            .setFooter({ text: config.embed.footer })
                            .setTimestamp();

                        const { ButtonBuilder, ButtonStyle } = await import('discord.js');
                        const onayButton = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`vatandaslik_onayla_${basvuruId}`)
                                    .setLabel('✅ Onayla')
                                    .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId(`vatandaslik_reddet_${basvuruId}`)
                                    .setLabel('❌ Reddet')
                                    .setStyle(ButtonStyle.Danger)
                            );

                        await adminChannel.send({
                            content: `<@&${config.adminRoleId}>`,
                            embeds: [basvuruEmbed],
                            components: [onayButton]
                        });
                    }

                    // Kullanıcıya onay mesajı
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(config.renkler.onay)
                                .setTitle('✅ Başvurunuz Alındı!')
                                .setDescription(
                                    `Üyelik başvurunuz başarıyla alındı ve değerlendirmeye alınıyor.\n\n` +
                                    `**📋 Başvuru Bilgileri:**\n` +
                                    `**İsim/Takma Ad:** ${isim}\n` +
                                    `**Yaş:** ${yas && yas.trim() ? yas : 'Belirtilmemiş'}\n` +
                                    `**Tanıtım:** ${sebep}\n\n` +
                                    `Başvurunuz yöneticiler tarafından incelenecek ve sonuç size bildirilecektir. Lütfen bekleyin! ⏳`
                                )
                                .setFooter({ text: config.embed.footer })
                                .setTimestamp()
                        ],
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('Başvuru kaydedilirken hata:', error);
                    await interaction.reply({
                        content: '❌ Başvurunuz kaydedilirken bir hata oluştu! Lütfen tekrar deneyin.',
                        ephemeral: true
                    });
                }
            }
        }
    }
};