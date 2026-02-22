// commands/vatandaslik-sistemi.js

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('vatandaslik-sistemi')
        .setDescription('Vatandaşlık alım sistemini başlatır (Sadece Adminler)')
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

            // Vatandaşlık kanalını al
            const channel = interaction.guild.channels.cache.get(config.vatandaslikKanali);
            
            if (!channel) {
                return await interaction.reply({
                    content: '❌ Vatandaşlık kanalı bulunamadı! Lütfen config.js dosyasını kontrol edin.',
                    ephemeral: true
                });
            }

            // Hoş geldin mesajı embedi
            const welcomeEmbed = new EmbedBuilder()
                .setColor(config.renkler.onay)
                .setTitle('🏛️ | Vatandaşlık Alımı Kanalına Hoş Geldin!')
                .setDescription(
                    '**Halaskar Fedai Cemiyeti\'ne hoş geldin!**\n\n' +
                    'Sunucumuza üye olmak ve tüm odalara erişim sağlamak için vatandaşlık başvurusu yapmanız gerekmektedir. ' +
                    'Bu basit bir onay sürecidir.\n\n' +
                    '**📋 Başvuru Süreci:**\n' +
                    '1️⃣ Aşağıdaki **"Başvuru Yap"** butonuna tıkla\n' +
                    '2️⃣ Kısa tanıtım formunu doldur\n' +
                    '3️⃣ Yönetici onayını bekle\n' +
                    '4️⃣ Onaylandıktan sonra tüm odalara erişim kazanacaksın!\n\n' +
                    '**✅ Kurallar:**\n' +
                    '• Sunucu kurallarına uymayı kabul ediyorum\n' +
                    '• Saygılı ve olgun davranacağım\n' +
                    '• Trollük ve spam yapmayacağım\n' +
                    '• Topluluk kurallarına uyacağım'
                )
                .setThumbnail(config.embed.thumbnail || null)
                .setFooter({ text: config.embed.footer })
                .setTimestamp();

            // Başvuru butonu
            const button = new ButtonBuilder()
                .setCustomId('vatandaslik_basvuru')
                .setLabel('📝 Başvuru Yap')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const row = new ActionRowBuilder().addComponents(button);

            // Mesajı kanala gönder
            await channel.send({
                embeds: [welcomeEmbed],
                components: [row]
            });

            await interaction.reply({
                content: `✅ Vatandaşlık sistemi başarıyla ${channel} kanalında başlatıldı!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Vatandaşlık sistemi başlatılırken hata:', error);
            await interaction.reply({
                content: '❌ Sistem başlatılırken bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};
