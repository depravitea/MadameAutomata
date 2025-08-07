import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, userMention } from 'discord.js';
import { CONFIG } from '../config.js';
import { prisma } from '../index.js';

export const data = new SlashCommandBuilder()
  .setName('own')
  .setDescription('Claim ownership of a consenting sub.')
  .addUserOption(o=>o.setName('subject').setDescription('Who?').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const subject = interaction.options.getUser('subject', true);
  await prisma.ownership.upsert({
    where: { guildId_ownerId_subjectId: { guildId: interaction.guildId!, ownerId: interaction.user.id, subjectId: subject.id } },
    update: {},
    create: { guildId: interaction.guildId!, ownerId: interaction.user.id, subjectId: subject.id }
  });

  const embed = new EmbedBuilder()
    .setTitle('A new bond forged')
    .setDescription(`${userMention(interaction.user.id)} now owns ${userMention(subject.id)}. Serve well.`)
    .setColor(CONFIG.theme.primary);

  await interaction.reply({ embeds: [embed] });
}
