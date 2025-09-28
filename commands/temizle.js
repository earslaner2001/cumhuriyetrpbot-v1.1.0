// commands/temizle.js
import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { isAuthorized } from '../utils/yetkiKontrol.js';
import config from '../config.js'; // config objesi olarak import edildi

export default {
    data: new SlashCommandBuilder()
        .setName('temizle')
        .setDescription('Kanalda belirtilen sayıda veya tüm mesajları siler.')
        .addStringOption(option =>
            option.setName('adet')
                .setDescription('Silinecek mesaj sayısı (1-100 arası sayı) veya "tümü"')
                .setRequired(true)),

    async execute(interaction) {
        const adetStr = interaction.options.getString('adet');
        const channel = interaction.channel;

        const requiredRoleId = config.adminRoleId; // config objesinden alındı
        const authorizedByRole = isAuthorized(interaction.member, requiredRoleId);

        const hasManageMessagesPerm = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

        if (!authorizedByRole && !hasManageMessagesPerm) {
            return interaction.reply({
                content: `⛔ Bu komutu kullanmak için **Mesajları Yönet** yetkisine veya **${interaction.guild.roles.cache.get(requiredRoleId)?.name || 'yetkili rolüne'}** sahip olmalısınız.`,
                ephemeral: true
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: '❌ Mesajları silmek için yeterli yetkim yok! Lütfen **Mesajları Yönet** yetkisi verdiğinizden emin olun.',
                ephemeral: true
            });
        }

        let deleteCount;

        if (adetStr.toLowerCase() === 'tümü') {
            await interaction.deferReply({ ephemeral: true });

            let deletedMessages = 0;
            let fetched;
            do {
                fetched = await channel.messages.fetch({ limit: 100 });
                const deletableMessages = fetched.filter(msg => Date.now() - msg.createdTimestamp < 1209600000);

                if (deletableMessages.size === 0) {
                    break;
                }

                await channel.bulkDelete(deletableMessages, true);
                deletedMessages += deletableMessages.size;
            } while (fetched.size > 0 && deletedMessages < 1000 && Date.now() - fetched.last().createdTimestamp < 1209600000);

            const embedMsg = new EmbedBuilder()
                .setTitle('🧹 Kanal Temizlendi!')
                .setDescription(`✅ Son 14 gün içinde silinebilecek toplam **${deletedMessages}** mesaj temizlendi.`)
                .setColor(config.renkler.onay) // config objesinden alındı
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail }) // config objesinden alındı
                .setTimestamp();

            return interaction.editReply({ embeds: [embedMsg] });

        } else {
            deleteCount = parseInt(adetStr);

            if (isNaN(deleteCount) || deleteCount < 1 || deleteCount > 100) {
                return interaction.reply({
                    content: '❌ Lütfen silinecek mesaj sayısını 1 ile 100 arasında bir sayı olarak girin veya "tümü" yazın.',
                    ephemeral: true
                });
            }

            try {
                const fetchedMessages = await channel.messages.fetch({ limit: deleteCount });
                const deletableMessages = fetchedMessages.filter(msg => Date.now() - msg.createdTimestamp < 1209600000);

                const deletedSize = deletableMessages.size;

                if (deletedSize === 0) {
                    return interaction.reply({
                        content: '⚠️ Belirtilen sayıda silinebilecek yeni mesaj bulunamadı (14 günden eski mesajlar silinemez).',
                        ephemeral: true
                    });
                }

                await channel.bulkDelete(deletableMessages, true);

                const embedMsg = new EmbedBuilder()
                    .setTitle('🧹 Kanal Temizlendi!')
                    .setDescription(`✅ Başarıyla **${deletedSize}** mesaj silindi.`)
                    .setColor(config.renkler.onay) // config objesinden alındı
                    .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail }) // config objesinden alındı
                    .setTimestamp();

                await interaction.reply({ embeds: [embedMsg] });

            } catch (error) {
                console.error('❌ Mesaj silinirken hata oluştu:', error);
                await interaction.reply({
                    content: '❌ Mesajları silerken bir hata oluştu. Botun yeterli yetkilere sahip olduğundan ve mesajların 14 günden eski olmadığından emin olun.',
                    ephemeral: true
                });
            }
        }
    },
};