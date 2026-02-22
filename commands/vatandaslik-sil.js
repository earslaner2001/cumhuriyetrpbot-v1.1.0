// commands/vatandaslik-sil.js

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';
import dbPromise from '../database/db.js';

export default {
    data: new SlashCommandBuilder()
        .setName('vatandaslik-sil')
        .setDescription('Belirli bir vatandaşlık başvurusunu veritabanından siler (Sadece Adminler)')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('Silinecek başvurunun ID numarası')
                .setRequired(true)
                .setMinValue(1))
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

            const basvuruId = interaction.options.getInteger('id');
            const db = await dbPromise;

            // Başvurunun varlığını kontrol et
            const basvuru = await db.get('SELECT * FROM vatandaslik_basvurulari WHERE id = ?', [basvuruId]);

            if (!basvuru) {
                return await interaction.reply({
                    content: `❌ **#${basvuruId}** ID'li başvuru bulunamadı!`,
                    ephemeral: true
                });
            }

            // Başvuruyu sil
            await db.run('DELETE FROM vatandaslik_basvurulari WHERE id = ?', [basvuruId]);

            // Başarılı mesajı
            const embed = new EmbedBuilder()
                .setColor(config.renkler.red)
                .setTitle('🗑️ Başvuru Silindi')
                .setDescription(
                    `**#${basvuruId}** ID'li başvuru veritabanından kalıcı olarak silindi.`
                )
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${basvuru.kullanici_id}> (${basvuru.kullanici_tag})`, inline: true },
                    { name: '📝 İsim', value: basvuru.isim, inline: true },
                    { name: '📊 Durum', value: basvuru.durum, inline: true },
                    { name: '🗑️ Silme İşlemini Yapan', value: interaction.user.tag, inline: false }
                )
                .setFooter({ text: config.embed.footer })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

            // Log kanalına bildirim gönder (varsa)
            const logChannel = interaction.guild.channels.cache.find(
                ch => ch.name.includes('log') || ch.name.includes('kayıt')
            );

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(config.renkler.uyari)
                    .setTitle('⚠️ Vatandaşlık Başvurusu Silindi')
                    .setDescription(
                        `**${interaction.user.tag}** tarafından **#${basvuruId}** ID'li başvuru silindi.`
                    )
                    .addFields(
                        { name: 'Başvuran', value: `<@${basvuru.kullanici_id}>`, inline: true },
                        { name: 'İsim', value: basvuru.isim, inline: true },
                        { name: 'Önceki Durum', value: basvuru.durum, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }

        } catch (error) {
            console.error('Başvuru silinirken hata:', error);
            await interaction.reply({
                content: '❌ Başvuru silinirken bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};
