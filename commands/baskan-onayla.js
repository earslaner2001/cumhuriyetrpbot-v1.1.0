// commands/baskan-onayla.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dbPromise from '../database/db.js';
import { isAuthorized } from '../utils/yetkiKontrol.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('baskan-karar')
        .setDescription('Bir kanun teklifini onaylar/reddeder ve yürürlüğe sokar.')
        .addIntegerOption(option =>
            option.setName('kanun_id')
                .setDescription('Onaylanacak kanun teklifinin ID\'si')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('karar')
                .setDescription('Başkanın kararı')
                .setRequired(true)
                .addChoices(
                    { name: '✅ Onaylıyorum', value: 'onayla' },
                    { name: '❌ Reddediyorum', value: 'reddet' }
                )
        )
        .addStringOption(option =>
            option.setName('gecis_sekli')
                .setDescription('Kanunun yürürlüğe giriş şekli (sadece onay için gerekli)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        console.log(`🔍 [BAŞKAN-ONAYLA] Komut başlatıldı - Kullanıcı: ${interaction.user.tag}`);

        const db = await dbPromise;
        const başkanRolüId = config.roller.başkan;

        // Yetki Kontrolü
        const yetkili = isAuthorized(interaction.member, başkanRolüId);
        if (!yetkili) {
            let displayRolName = başkanRolüId;
            if (başkanRolüId && interaction.guild) {
                const role = interaction.guild.roles.cache.get(başkanRolüId);
                if (role) {
                    displayRolName = role.name;
                }
            }
            console.log(`❌ [BAŞKAN-ONAYLA] Yetki hatası: ${interaction.user.tag}`);
            return interaction.editReply({
                content: `⛔ Bu komutu sadece **${displayRolName}** rolüne sahip olanlar kullanabilir.`,
                ephemeral: true
            });
        }

        const kanunId = interaction.options.getInteger('kanun_id');
        const karar = interaction.options.getString('karar');
        const gecisSekli = interaction.options.getString('gecis_sekli');

        console.log(`🔍 [BAŞKAN-ONAYLA] Parametreler:`, { kanunId, karar, gecisSekli });

        try {
            // Kanun kontrolü
            const kanun = await db.get(`SELECT * FROM kanunlar WHERE id = ?`, [kanunId]);
            if (!kanun) {
                console.log(`❌ [BAŞKAN-ONAYLA] Kanun bulunamadı: ${kanunId}`);
                return interaction.editReply({
                    content: '❌ Belirtilen ID\'de bir kanun teklifi bulunamadı.',
                    ephemeral: true
                });
            }

            // Kanun durumu kontrolü
            if (kanun.durum !== 'Oylamada') {
                console.log(`⚠️ [BAŞKAN-ONAYLA] Kanun oylamada değil: ${kanun.durum}`);
                return interaction.editReply({
                    content: `⚠️ Bu kanun şu anda oylamada değil. Mevcut durum: **${kanun.durum}**`,
                    ephemeral: true
                });
            }

            // Onay için geçiş şekli kontrolü
            if (karar === 'onayla' && !gecisSekli) {
                return interaction.editReply({
                    content: '❌ Kanunu onaylarken "gecis_sekli" parametresini belirtmelisiniz.',
                    ephemeral: true
                });
            }

            // Oyları hesapla
            const oylar = await db.all(`SELECT oy FROM oylar WHERE kanun_id = ?`, [kanunId]);
            const evetOylari = oylar.filter(o => o.oy === 'evet').length;
            const hayirOylari = oylar.filter(o => o.oy === 'hayır').length;
            const toplamOy = evetOylari + hayirOylari;

            console.log(`📊 [BAŞKAN-ONAYLA] Oylama sonuçları:`, { evetOylari, hayirOylari, toplamOy });

            let yeniDurum;
            let sonucMesaji;
            let embedRenk;
            let embedIcon;

            if (karar === 'onayla') {
                yeniDurum = 'Yürürlükte';
                sonucMesaji = '✅ Kanun Başkan tarafından onaylandı ve yürürlüğe girdi!';
                embedRenk = config.renkler.onay || '#4caf50';
                embedIcon = '✅';
                
                await db.run(
                    `UPDATE kanunlar SET durum = ?, yururluge_giris_sekli = ? WHERE id = ?`,
                    [yeniDurum, gecisSekli, kanunId]
                );
            } else {
                yeniDurum = 'Reddedildi';
                sonucMesaji = '❌ Kanun Başkan tarafından reddedildi.';
                embedRenk = config.renkler.hata || '#f44336';
                embedIcon = '❌';
                
                await db.run(`UPDATE kanunlar SET durum = ? WHERE id = ?`, [yeniDurum, kanunId]);
            }

            console.log(`✅ [BAŞKAN-ONAYLA] Kanun durumu güncellendi: ${yeniDurum}`);

            // Oylama yüzdelerini hesapla
            const evetYuzde = toplamOy > 0 ? ((evetOylari / toplamOy) * 100).toFixed(1) : 0;
            const hayirYuzde = toplamOy > 0 ? ((hayirOylari / toplamOy) * 100).toFixed(1) : 0;

            // Embed oluştur
            const embed = new EmbedBuilder()
                .setTitle(`${embedIcon} Başkan Kararı - Kanun #${kanunId}`)
                .setDescription(`**${kanun.baslik}**`)
                .addFields(
                    {
                        name: '📋 Kanun Bilgileri',
                        value: `**Teklif Sahibi:** ${kanun.teklif_sahibi}\n**Açıklama:** ${kanun.aciklama || 'Belirtilmemiş'}`,
                        inline: false
                    },
                    {
                        name: '🗳️ Oylama Sonuçları',
                        value: `**Evet:** ${evetOylari} (%${evetYuzde})\n**Hayır:** ${hayirOylari} (%${hayirYuzde})\n**Toplam:** ${toplamOy} oy`,
                        inline: true
                    },
                    {
                        name: '⚖️ Başkan Kararı',
                        value: sonucMesaji,
                        inline: true
                    }
                )
                .setColor(embedRenk)
                .setFooter({ text: `${config.embed.footer} • v${config.version}`, iconURL: config.embed.thumbnail })
                .setTimestamp();

            // Yürürlük bilgisi ekleme
            if (karar === 'onayla' && gecisSekli) {
                embed.addFields({
                    name: '📜 Yürürlük Bilgisi',
                    value: `**Geçiş Şekli:** ${gecisSekli}`,
                    inline: false
                });
            }

            // Sonucu gönder
            await interaction.editReply({ 
                embeds: [embed], 
                ephemeral: false 
            });

            console.log(`✅ [BAŞKAN-ONAYLA] Başarıyla tamamlandı - Kanun #${kanunId} ${yeniDurum}`);

        } catch (err) {
            console.error('❌ [BAŞKAN-ONAYLA] Hata oluştu:', err);
            await interaction.editReply({
                content: '❌ Komut işlenirken bir hata oluştu. Lütfen logları kontrol edin.',
                ephemeral: true
            });
        }
    },
};