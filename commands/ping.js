import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun gecikmesini ölçer.');

export async function execute(interaction) {
    const sent = await interaction.reply({ content: 'Pong!', fetchReply: true });
    const ping = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(
        `🏓 Pong! Bot gecikmesi: **${ping}ms** | API gecikmesi: **${interaction.client.ws.ping}ms**`
    );
}