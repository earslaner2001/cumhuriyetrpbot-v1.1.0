// commands/ordu-darbe.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dbPromise from '../database/db.js';
import { isAuthorized } from '../utils/yetkiKontrol.js';
import config from '../config.js'; // config objesi olarak import edildi

export default {
    data: new SlashCommandBuilder()
        .setName('ordu-darbe')
        .setDescription('Ordunun zorla bir kanunu yürürlüğe sokmasını sağlar.')
        .addIntegerOption(option =>
            option.setName('kanun_id')
                .setDescription('Yürürlüğe sokulacak kanunun ID’si')
                .setRequired(true)),

    async execute(interaction) {
        const kanunId = interaction.options.getInteger('kanun_id');
        const db = await dbPromise;

        // Yetki Kontrolü
        const yetkiliRolId = config.roller.asker; // config objesinden alındı
        const yetkili = isAuthorized(interaction.member, yetkiliRolId);
        if (!yetkili) {
            const yetkiliRolObj = interaction.guild.roles.cache.get(yetkiliRolId);
            const yetkiliRolAdi = yetkiliRolObj ? yetkiliRolObj.name : 'Asker';
            return interaction.reply({
                content: `⛔ Bu komutu sadece **${yetkiliRolAdi}** rolüne sahip olanlar kullanabilir.`,
                ephemeral: true
            });
        }

        try {
            const existingKanun = await db.get(`SELECT baslik, durum FROM kanunlar WHERE id = ?`, [kanunId]);

            if (!existingKanun) {
                return interaction.reply({
                    content: '❌ Belirtilen ID’de bir kanun bulunamadı.',
                    ephemeral: true
                });
            }

            if (existingKanun.durum === 'Yürürlükte') {
                return interaction.reply({
                    content: `⚠️ **${existingKanun.baslik}** başlıklı kanun zaten yürürlükte.`,
                    ephemeral: true
                });
            }

            await db.run(`
                UPDATE kanunlar
                SET durum = 'Yürürlükte', yururluge_giris_sekli = 'Ordu Darbesi'
                WHERE id = ?
            `, [kanunId]);

            await db.run(`
                UPDATE oyun_durumu
                SET memnuniyet_seviyesi = MAX(0, memnuniyet_seviyesi - 10)
                WHERE id = 1
            `);
            console.log(`❌ Ordu darbesi ile memnuniyet seviyesi düşürüldü.`);


            const embedMsg = new EmbedBuilder()
                .setTitle('🚨 Ordu Müdahalesi!')
                .setDescription(`**#${kanunId} - ${existingKanun.baslik}** başlıklı kanun, ordunun müdahalesiyle zorla yürürlüğe girdi!`)
                .addFields(
                    { name: 'Yürürlüğe Giriş Şekli', value: 'Ordu Darbesi', inline: true }
                )
                .setColor(config.renkler.red) // config objesinden alındı
                .setFooter({ text: `${config.embed.footer} • v${config.version}`, iconURL: config.embed.thumbnail }) // config objesinden alındı
                .setTimestamp();

            await interaction.reply({ embeds: [embedMsg] });

        } catch (error) {
            console.error('❌ Ordu darbe komutunda hata oluştu:', error);
            await interaction.reply({
                content: '❌ Ordu darbe işlemi sırasında bir hata oluştu. Lütfen logları kontrol edin.',
                ephemeral: true
            });
        }
    }
};