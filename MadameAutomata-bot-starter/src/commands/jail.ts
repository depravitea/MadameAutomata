import { SlashCommandBuilder, ChatInputCommandInteraction, userMention } from 'discord.js';
import { prisma } from '../index.js';

export const data = new SlashCommandBuilder()
  .setName('jail')
  .setDescription('Send a user to time-out jail (role-based).')
  .addUserOption(o=>o.setName('user').setDescription('Target').setRequired(true))
  .addIntegerOption(o=>o.setName('minutes').setDescription('Duration').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const minutes = interaction.options.getInteger('minutes', true);
  await prisma.punishment.create({
    data: { guildId: interaction.guildId!, userId: user.id, type: 'jail', reason: 'Timeout', expiresAt: new Date(Date.now()+minutes*60000), createdBy: interaction.user.id }
  });
  await interaction.reply(`${userMention(user.id)} has been sent to jail for ${minutes} minute(s).`);
}
