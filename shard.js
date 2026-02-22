// shard.js - Shard Manager

import { ShardingManager } from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

console.log(chalk.magenta('╔═══════════════════════════════════════╗'));
console.log(chalk.magenta('║   🚀 Discord Bot Shard Manager 🚀   ║'));
console.log(chalk.magenta('╚═══════════════════════════════════════╝'));
console.log();

// Komut satırı argümanını al veya varsayılan kullan
const args = process.argv.slice(2);
let shardCount;

if (args.length === 0) {
    // Argüman yoksa 3 shard kullan
    shardCount = 3;
    console.log(chalk.yellow('⚙️  Argüman belirtilmedi, varsayılan 3 shard kullanılıyor...'));
    console.log(chalk.cyan('💡 Kullanım: node shard.js <sayı> veya node shard.js auto'));
} else if (args[0].toLowerCase() === 'auto') {
    shardCount = 'auto';
    console.log(chalk.green('✅ Otomatik shard modu seçildi'));
} else {
    const parsed = parseInt(args[0]);
    if (isNaN(parsed) || parsed < 1) {
        console.log(chalk.red('❌ Geçersiz sayı! Varsayılan 3 shard kullanılıyor...'));
        shardCount = 3;
    } else {
        shardCount = parsed;
        console.log(chalk.green(`✅ Manuel ${shardCount} shard seçildi`));
    }
}

console.log();
startSharding(shardCount);

function startSharding(shardCount) {
    
    console.log();
    console.log(chalk.magenta('═══════════════════════════════════════'));
    console.log(chalk.green(`✅ Shard sayısı: ${shardCount === 'auto' ? 'Otomatik' : shardCount}`));
    console.log(chalk.magenta('═══════════════════════════════════════'));
    console.log();

    const manager = new ShardingManager('./index.js', {
        token: process.env.TOKEN,
        totalShards: shardCount,
        respawn: true,
        mode: 'worker'
    });

    manager.on('shardCreate', shard => {
        console.log(chalk.cyan(`🚀 Shard #${shard.id} başlatıldı!`));
        
        shard.on('ready', () => {
            console.log(chalk.green(`✅ Shard #${shard.id} hazır ve çalışıyor!`));
        });

        shard.on('disconnect', () => {
            console.log(chalk.yellow(`⚠️ Shard #${shard.id} bağlantısı kesildi!`));
        });

        shard.on('reconnecting', () => {
            console.log(chalk.blue(`🔄 Shard #${shard.id} yeniden bağlanıyor...`));
        });

        shard.on('death', () => {
            console.log(chalk.red(`💀 Shard #${shard.id} öldü!`));
        });
    });

    console.log(chalk.magenta('🔧 Shard Manager başlatılıyor...\n'));

    manager.spawn({ timeout: 60000 })
        .then(() => {
            console.log(chalk.green('\n✨ Tüm shard\'lar başarıyla başlatıldı!'));
            console.log(chalk.cyan(`📊 Toplam ${shardCount === 'auto' ? 'otomatik belirlenen' : shardCount} shard aktif!\n`));
        })
        .catch(err => {
            console.error(chalk.red('❌ Shard başlatma hatası:'), err);
            process.exit(1);
        });
}
