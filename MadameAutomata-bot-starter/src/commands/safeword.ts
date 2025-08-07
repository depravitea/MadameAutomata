import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CONFIG } from '../config.js';
import { prisma } from '../index.js';

export const data = new SlashCommandBuilder()
  .setName('safeword')
  .setDescription('Log a safeword and cool down interactions.')
  .addStringOption(o=>o.setName('tier').setDescription('yellow/red/black').setRequired(true).addChoices(
    { name: 'yellow', value: 'yellow' },
    { name: 'red', value: 'red' },
    { name: 'black', value: 'black' }
  ))
  .addStringOption(o=>o.setName('context').setDescription('Optional note'));

export async function execute(interaction: ChatInputCommandInteraction) {
  const tier = interaction.options.getString('tier', true);
  const context = interaction.options.getString('context') ?? null;
  await prisma.safewordLog.create({
    data: { guildId: interaction.guildId!, userId: interaction.user.id, tier, context }
  });
  const embed = new EmbedBuilder()
    .setTitle(`Safeword acknowledged: ${tier.toUpperCase()}`)
    .setDescription('All active interactions should pause. Take a breath.')
    .setColor(CONFIG.theme.primary);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
