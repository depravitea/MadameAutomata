import { SlashCommandBuilder, ChatInputCommandInteraction, userMention } from 'discord.js';
import { prisma } from '../index.js';

export const data = new SlashCommandBuilder()
  .setName('assign')
  .setDescription('Assign a task to someone.')
  .addUserOption(o=>o.setName('to').setDescription('Assignee').setRequired(true))
  .addStringOption(o=>o.setName('title').setDescription('Task title').setRequired(true))
  .addStringOption(o=>o.setName('details').setDescription('Optional details'));

export async function execute(interaction: ChatInputCommandInteraction) {
  const to = interaction.options.getUser('to', true);
  const title = interaction.options.getString('title', true);
  const details = interaction.options.getString('details') ?? undefined;
  await prisma.task.create({
    data: { guildId: interaction.guildId!, assigner: interaction.user.id, assignee: to.id, title, details }
  });
  await interaction.reply(`Task assigned to ${userMention(to.id)}: **${title}**`);
}
