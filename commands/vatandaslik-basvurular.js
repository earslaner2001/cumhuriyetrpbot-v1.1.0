// commands/vatandaslik-basvurular.js

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';
import dbPromise from '../database/db.js';

export default {
    data: new SlashCommandBuilder()
        .setName('vatandaslik-basvurular')
        .setDescription('Tüm vatandaşlık başvurularını listeler (Sadece Adminler)')
        .addStringOption(option =>
            option.setName('durum')
                .setDescription('Hangi durumdaki başvuruları görmek istiyorsunuz?')
                .setRequired(false)
                .addChoices(
                    { name: 'Beklemede', value: 'Beklemede' },
                    { name: 'Onaylandı', value: 'Onaylandı' },
                    { name: 'Reddedildi', value: 'Reddedildi' },
                    { name: 'Tümü', value: 'Tümü' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            // Admin kontrolü
            if (!interaction.member.roles.cache.has(config.adminRoleId)) {
                return await interaction.reply({
                    content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!',
                    ephemeral: true
                });
            }

            const durum = interaction.options.getString('durum') || 'Beklemede';
            const db = await dbPromise;

            // Başvuruları çek
            let basvurular;
            if (durum === 'Tümü') {
                basvurular = await db.all('SELECT * FROM vatandaslik_basvurulari ORDER BY basvuru_tarihi DESC LIMIT 25');
            } else {
                basvurular = await db.all('SELECT * FROM vatandaslik_basvurulari WHERE durum = ? ORDER BY basvuru_tarihi DESC LIMIT 25', [durum]);
            }

            if (!basvurular || basvurular.length === 0) {
                return await interaction.reply({
                    content: `📋 **${durum}** durumunda başvuru bulunamadı.`,
                    ephemeral: true
                });
            }

            // Embed oluştur
            const embed = new EmbedBuilder()
                .setColor(config.renkler.bilgi)
                .setTitle(`📋 Vatandaşlık Başvuruları - ${durum}`)
                .setDescription(`Toplam ${basvurular.length} başvuru gösteriliyor (En fazla 25)`)
                .setFooter({ text: config.embed.footer })
                .setTimestamp();

            // Her başvuru için field ekle
            for (const basvuru of basvurular.slice(0, 10)) { // En fazla 10 göster
                const durumEmoji = basvuru.durum === 'Beklemede' ? '⏳' : basvuru.durum === 'Onaylandı' ? '✅' : '❌';
                
                embed.addFields({
                    name: `${durumEmoji} #${basvuru.id} - ${basvuru.isim}`,
                    value: 
                        `**Kullanıcı:** <@${basvuru.kullanici_id}>\n` +
                        `**Yaş:** ${basvuru.yas || 'Belirtilmemiş'}\n` +
                        `**Durum:** ${basvuru.durum}\n` +
                        `**Başvuru:** <t:${Math.floor(new Date(basvuru.basvuru_tarihi).getTime() / 1000)}:R>` +
                        (basvuru.islem_yapan ? `\n**İşlem Yapan:** ${basvuru.islem_yapan}` : ''),
                    inline: false
                });
            }

            if (basvurular.length > 10) {
                embed.addFields({
                    name: '📌 Not',
                    value: `Sadece ilk 10 başvuru gösteriliyor. Toplam ${basvurular.length} başvuru var.`,
                    inline: false
                });
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Başvurular listelenirken hata:', error);
            await interaction.reply({
                content: '❌ Başvurular listelenirken bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};
