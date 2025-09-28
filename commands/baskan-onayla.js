// commands/baskan-onayla.js
import pkg from 'discord.js'; // Önceki hatayı çözmek için bu satırı ekledik
const { SlashCommandBuilder, EmbedBuilder, MessageActionRow, MessageButton, MessageFlags } = pkg; // Ve bu satırı

import dbPromise from '../database/db.js';
import config from '../config.js';

export default {
    data: new SlashCommandBuilder()
        .setName('baskan-onayla')
        .setDescription('Bir kanun teklifini onaylar ve yürürlüğe sokar.')
        .addIntegerOption(option =>
            option.setName('kanun_id')
                .setDescription('Onaylanacak kanun teklifinin ID’si')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('gecis_sekli')
                .setDescription('Kanunun yürürlüğe giriş şekli (örneğin: "Resmi Gazete ile")')
                .setRequired(true)),

    async execute(interaction) {
        console.log(`[BASKAN-ONAYLA] Komut çağrıldı. Kullanıcı: ${interaction.user.tag}, Kanun ID: ${interaction.options.getInteger('kanun_id')}`);
        // Etkileşimi hemen ertele (Discord'a 3 saniye içinde yanıt verildiğini bildir)
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Kullanıcıya özel yanıt
        console.log(`[BASKAN-ONAYLA] DeferReply gönderildi.`);

        const kanunId = interaction.options.getInteger('kanun_id');
        const gecisSekli = interaction.options.getString('gecis_sekli');
        const db = await dbPromise;

        // Yetki kontrolü (sadece belirli bir rolün bu komutu kullanmasına izin ver)
        // Lütfen bu kısmı kendi rol ID'nizle güncelleyin.
        const requiredRoleId = '920832297199087677'; // Buraya yetkili rolünün ID'sini girin
        if (!interaction.member.roles.cache.has(requiredRoleId)) {
            console.log(`[BASKAN-ONAYLA] Yetki hatası: ${interaction.user.tag} gerekli role sahip değil.`);
            return interaction.editReply({
                content: '❌ Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.',
                flags: MessageFlags.Ephemeral
            });
        }
        console.log(`[BASKAN-ONAYLA] Yetki kontrolü başarılı.`);

        try {
            console.log(`[BASKAN-ONAYLA] Veritabanından kanun kontrol ediliyor (ID: ${kanunId})...`);
            const kanun = await db.get(`SELECT * FROM kanunlar WHERE id = ?`, [kanunId]);
            console.log(`[BASKAN-ONAYLA] Kanun kontrol sonucu:`, kanun);

            if (!kanun) {
                console.log(`[BASKAN-ONAYLA] Kanun bulunamadı: ${kanunId}`);
                return interaction.editReply({ content: '❌ Belirtilen ID’de bir kanun teklifi bulunamadı.', flags: MessageFlags.Ephemeral });
            }

            if (kanun.durum !== 'Oylamada') {
                console.log(`[BASKAN-ONAYLA] Kanun oylamada değil. Mevcut durum: ${kanun.durum}`);
                return interaction.editReply({ content: `⚠️ Bu kanun teklifi şu anda "Oylamada" durumunda değil. Mevcut durumu: **${kanun.durum}**`, flags: MessageFlags.Ephemeral });
            }

            // Oyları kontrol et ve geçerliliği belirle
            console.log(`[BASKAN-ONAYLA] Oylar hesaplanıyor (Kanun ID: ${kanunId})...`);
            const oylar = await db.all(`SELECT oy FROM oylar WHERE kanun_id = ?`, [kanunId]);
            const evetOylari = oylar.filter(o => o.oy === 'evet').length;
            const hayirOylari = oylar.filter(o => o.oy === 'hayır').length;
            const toplamOy = evetOylari + hayirOylari;
            console.log(`[BASKAN-ONAYLA] Oylama sonuçları: Evet: ${evetOylari}, Hayır: ${hayirOylari}, Toplam: ${toplamOy}`);

            let sonucMesaji;
            let durumGuncellemesi;
            let renk = config.renkler.bilgi; // Varsayılan renk

            if (toplamOy < 1) { // Eğer hiç oy yoksa
                sonucMesaji = `⛔ Bu kanun teklifi için henüz yeterli oy kullanılmamış. (Toplam oy: ${toplamOy})`;
                durumGuncellemesi = kanun.durum; // Durumu değiştirmeden bırak
                renk = config.renkler.hata;
            } else if (evetOylari > hayirOylari) {
                sonucMesaji = `✅ Kanun teklifi yeterli "Evet" oyu alarak kabul edildi ve yürürlüğe girdi!`;
                durumGuncellemesi = 'Yürürlükte';
                renk = config.renkler.onay;
            } else {
                sonucMesaji = `❌ Kanun teklifi yeterli oyu alamadığı için reddedildi.`;
                durumGuncellemesi = 'Reddedildi';
                renk = config.renkler.hata;
            }
            console.log(`[BASKAN-ONAYLA] Kanun sonuç mesajı: ${sonucMesaji}, Durum güncellemesi: ${durumGuncellemesi}`);


            // Kanunun durumunu güncelle
            console.log(`[BASKAN-ONAYLA] Kanun durumu güncelleniyor...`);
            await db.run(
                `UPDATE kanunlar SET durum = ?, yururluge_giris_sekli = ? WHERE id = ?`,
                [durumGuncellemesi, (durumGuncellemesi === 'Yürürlükte' ? gecisSekli : null), kanunId]
            );
            console.log(`[BASKAN-ONAYLA] Kanun durumu güncellendi.`);


            const embed = new EmbedBuilder()
                .setTitle(`Kanun Onaylama Sonucu: #${kanunId}`)
                .setDescription(`
                    **Başlık:** ${kanun.baslik}
                    **Teklif Sahibi:** ${kanun.teklif_sahibi}
                    **Oylama Sonuçları:**
                    - Evet: ${evetOylari}
                    - Hayır: ${hayirOylari}
                    **Sonuç:** ${sonucMesaji}
                    ${durumGuncellemesi === 'Yürürlükte' ? `**Yürürlüğe Giriş Şekli:** ${gecisSekli}` : ''}
                `)
                .setColor(renk)
                .setFooter({ text: config.embed.footer, iconURL: config.embed.thumbnail })
                .setTimestamp();

            console.log(`[BASKAN-ONAYLA] Embed oluşturuldu. Yanıt gönderiliyor...`);
            await interaction.editReply({ embeds: [embed] });
            console.log(`[BASKAN-ONAYLA] Yanıt başarıyla gönderildi.`);

        } catch (error) {
            console.error('❌ [BASKAN-ONAYLA] Komut çalıştırılırken bir hata oluştu:', error);
            // Eğer deferReply gönderilmişse editReply kullan, yoksa reply kullan
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '❌ Komut yürütülürken bir hata meydana geldi. Lütfen logları kontrol edin.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [BASKAN-ONAYLA] Hata yanıtı gönderilirken de hata oluştu:", err));
            } else {
                await interaction.reply({
                    content: '❌ Komut yürütülürken beklenmedik bir hata meydana geldi.',
                    flags: MessageFlags.Ephemeral
                }).catch(err => console.error("❌ [BASKAN-ONAYLA] Hata yanıtı gönderilirken de hata oluştu:", err));
            }
        }
    }
};