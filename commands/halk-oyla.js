// commands/halk-oyla.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dbPromise from '../database/db.js';
import { isAuthorized } from '../utils/yetkiKontrol.js';
import config from '../config.js'; // config objesi olarak import edildi

export default {
    data: new SlashCommandBuilder()
        .setName('halk-oyla')
        .setDescription('Bir kanun teklifi için oy kullanır.')
        .addIntegerOption(option =>
            option.setName('kanun_id')
                .setDescription('Oylanacak kanunun ID’si')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('oy')
                .setDescription('Oyunuzu seçin (evet/hayır)')
                .setRequired(true)
                .addChoices(
                    { name: 'Evet', value: 'evet' },
                    { name: 'Hayır', value: 'hayır' }
                )),

    async execute(interaction) {
        // !!! BURAYA EKLİYORUZ: Etkileşimi hemen ertele !!!
        // ephemeral: true, sadece komutu kullanan kişinin görmesini sağlar.
        await interaction.deferReply({ ephemeral: true });

        const db = await dbPromise;
        const halkRolüId = config.roller.halk; // config objesinden rol ID'si (veya adı) alındı

        // Yetki Kontrolü
        const yetkili = isAuthorized(interaction.member, halkRolüId);
        if (!yetkili) {
            let displayRolName = halkRolüId; // Varsayılan olarak ID
            if (halkRolüId && interaction.guild) {
                const role = interaction.guild.roles.cache.get(halkRolüId);
                if (role) {
                    displayRolName = role.name;
                }
            }
            return interaction.editReply({ // !!! interaction.reply yerine editReply !!!
                content: `⛔ Bu komutu sadece **${displayRolName}** rolüne sahip olanlar kullanabilir.`,
                ephemeral: true
            });
        }

        const kanunId = interaction.options.getInteger('kanun_id');
        const oy = interaction.options.getString('oy');
        const voterId = interaction.user.id;

        try {
            // Kanun durumunu kontrol et
            const kanun = await db.get(`SELECT durum, baslik FROM kanunlar WHERE id = ?`, [kanunId]);
            if (!kanun) {
                return interaction.editReply({ content: '❌ Belirtilen ID’de bir kanun bulunamadı.', ephemeral: true }); // !!! editReply !!!
            }
            if (kanun.durum !== 'Oylamada') {
                return interaction.editReply({ content: `⚠️ Kanun teklifi #${kanunId} şu anda oylamada değil. Durumu: **${kanun.durum}**`, ephemeral: true }); // !!! editReply !!!
            }

            // Kullanıcının daha önce oy kullanıp kullanmadığını kontrol et
            const existingVote = await db.get(`SELECT * FROM oylar WHERE kanun_id = ? AND kullanici_id = ?`, [kanunId, voterId]);
            if (existingVote) {
                return interaction.editReply({ content: `⚠️ Zaten bu kanun için oy kullandınız (**${existingVote.oy}**). Oyuncular sadece bir kere oy kullanabilir.`, ephemeral: true }); // !!! editReply !!!
            }

            // Oy kaydını veritabanına ekle
            await db.run(`INSERT INTO oylar (kanun_id, kullanici_id, oy, tarih) VALUES (?, ?, ?, ?)`,
                [kanunId, voterId, oy, new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })]);

            const embedMsg = new EmbedBuilder()
                .setTitle('✅ Oy Kullanıldı!')
                .setDescription(`**${kanun.baslik}** başlıklı kanun için **${oy.toUpperCase()}** oyu kullandınız. Teşekkür ederiz!`)
                .setColor(oy === 'evet' ? config.renkler.evet : config.renkler.hayir) // config objesinden alındı
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail }) // config objesinden alındı
                .setTimestamp();

            await interaction.editReply({ embeds: [embedMsg], ephemeral: false }); // !!! editReply ve ephemeral ayarı !!!

        } catch (err) {
            console.error('❌ Oy kullanma sırasında bir hata oluştu:', err);
            // Hata durumunda da editReply kullanmalıyız.
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ Oy kullanma sırasında bir hata oluştu. Lütfen logları kontrol edin.', ephemeral: true });
            } else {
                // Bu durum normalde deferReply kullandığımız için tetiklenmemeli.
                await interaction.reply({ content: '❌ Oy kullanma sırasında beklenmedik bir hata oluştu.', ephemeral: true });
            }
        }
    },
};