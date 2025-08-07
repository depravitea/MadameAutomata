import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { CONFIG } from '../config.js';
import { prisma } from '../index.js';

export const data = new SlashCommandBuilder()
  .setName('house-setup')
  .setDescription('Initial setup: set welcome, logs, and theme.')
  .addChannelOption(o=>o.setName('welcome').setDescription('Welcome channel').setRequired(true))
  .addChannelOption(o=>o.setName('logs').setDescription('Logs channel').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const welcome = interaction.options.getChannel('welcome', true);
  const logs = interaction.options.getChannel('logs', true);
  await prisma.guildConfig.upsert({
    where: { guildId: interaction.guildId! },
    update: { welcomeChan: welcome.id, logChan: logs.id },
    create: { guildId: interaction.guildId!, welcomeChan: welcome.id, logChan: logs.id }
  });

  const embed = new EmbedBuilder()
    .setTitle('House setup complete')
    .setDescription('Welcome and log channels saved.')
    .setColor(CONFIG.theme.primary);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
