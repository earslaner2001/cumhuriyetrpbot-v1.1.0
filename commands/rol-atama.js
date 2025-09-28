// commands/rol-atama.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAuthorized } from '../utils/yetkiKontrol.js';
import config from '../config.js'; // config objesi olarak import edildi

export default {
    data: new SlashCommandBuilder()
        .setName('rol-atama')
        .setDescription('Bir üyeye belirtilen rolü atar veya varolan rolünü günceller.')
        .addUserOption(option =>
            option.setName('uye')
                .setDescription('Rol atanacak üye')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Atanacak rol')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getMember('uye');
        const targetRole = interaction.options.getRole('rol');

        const yetkiliRolId = config.panel.yetkiliRol; // config objesinden alındı

        const yetkili = isAuthorized(interaction.member, yetkiliRolId);
        if (!yetkili) {
            const yetkiliRolObj = interaction.guild.roles.cache.get(yetkiliRolId);
            const yetkiliRolAdi = yetkiliRolObj ? yetkiliRolObj.name : 'Yetkili Rol';

            return interaction.reply({
                content: `⛔ Bu komutu sadece **${yetkiliRolAdi}** rolüne sahip olanlar kullanabilir.`,
                ephemeral: true
            });
        }

        if (!targetUser) {
            return interaction.reply({ content: '❌ Belirtilen üye bulunamadı.', ephemeral: true });
        }

        if (!targetRole) {
            return interaction.reply({ content: '❌ Belirtilen rol bulunamadı.', ephemeral: true });
        }

        if (interaction.guild.members.me.roles.highest.position <= targetRole.position) {
            return interaction.reply({
                content: `❌ Atamaya çalıştığınız **${targetRole.name}** rolü botun rolünden daha yüksek veya eşit. Bot bu rolü atayamaz. Botun rolünü bu rolün üzerine taşıyın.`,
                ephemeral: true
            });
        }

        try {
            const rolesToRemove = [];
            for (const roleId of Object.values(config.roller)) { // config objesinden alındı
                if (targetUser.roles.cache.has(roleId)) {
                    rolesToRemove.push(roleId);
                }
            }

            if (rolesToRemove.length > 0) {
                await targetUser.roles.remove(rolesToRemove);
            }

            await targetUser.roles.add(targetRole.id);

            const embedMsg = new EmbedBuilder()
                .setTitle('✅ Rol Ataması Başarılı!')
                .setDescription(`**${targetUser.user.tag}** adlı üyeye **${targetRole.name}** rolü başarıyla atandı.`)
                .setColor(config.renkler.onay) // config objesinden alındı
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail }) // config objesinden alındı
                .setTimestamp();

            await interaction.reply({ embeds: [embedMsg] });

        } catch (error) {
            console.error('❌ Rol atama sırasında hata oluştu:', error);
            if (error.code === 50013) {
                await interaction.reply({
                    content: '❌ Rol atamak için yeterli yetkim yok! Lütfen botun rolünün, atamaya çalıştığınız rolden daha yukarıda olduğundan emin olun.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ Rol atama sırasında bir hata oluştu. Lütfen logları kontrol edin.',
                    ephemeral: true
                });
            }
        }
    }
};