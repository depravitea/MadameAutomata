import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CONFIG } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Send the gothic welcome embed again.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('Femdom 𝐹𝜀𝑚𝜕𝜎𝑚 𝐸𝑚𝑝𝑦𝑟𝑒𝑎𝑛')
    .setDescription('Enter with consent. Serve with grace. Leave better than you arrived.')
    .setColor(CONFIG.theme.primary)
    .setThumbnail('attachment://avatar.jpg')
    .setFooter({ text: 'MadameAutomata' });

  await interaction.reply({ embeds: [embed], files: [{ attachment: 'assets/avatar.jpg', name: 'avatar.jpg' }] });
}
