import { SlashCommandBuilder, ChatInputCommandInteraction, userMention } from 'discord.js';
import { prisma } from '../index.js';

export const data = new SlashCommandBuilder()
  .setName('release')
  .setDescription('Release a subject you own.')
  .addUserOption(o=>o.setName('subject').setDescription('Who?').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const subject = interaction.options.getUser('subject', true);
  await prisma.ownership.deleteMany({
    where: { guildId: interaction.guildId!, ownerId: interaction.user.id, subjectId: subject.id }
  });
  await interaction.reply(`Bond released between <@${interaction.user.id}> and <@${subject.id}>.`);
}
