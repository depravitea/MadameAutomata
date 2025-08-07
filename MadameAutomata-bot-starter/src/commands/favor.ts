import { SlashCommandBuilder, ChatInputCommandInteraction, userMention } from 'discord.js';
import { prisma } from '../index.js';

export const data = new SlashCommandBuilder()
  .setName('favor')
  .setDescription('Check or grant House Favor.')
  .addSubcommand(s=>s.setName('check').setDescription('Check your favor'))
  .addSubcommand(s=>s.setName('give').setDescription('Give favor to a user')
    .addUserOption(o=>o.setName('to').setDescription('User').setRequired(true))
    .addIntegerOption(o=>o.setName('amount').setDescription('Amount').setRequired(true))
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'check') {
    const acct = await prisma.economyAccount.upsert({
      where: { guildId_userId: { guildId: interaction.guildId!, userId: interaction.user.id } },
      update: {},
      create: { guildId: interaction.guildId!, userId: interaction.user.id }
    });
    await interaction.reply(`${userMention(interaction.user.id)} has **${acct.favor}** favor.`);
  } else if (sub === 'give') {
    const to = interaction.options.getUser('to', true);
    const amt = interaction.options.getInteger('amount', true);
    await prisma.economyAccount.upsert({
      where: { guildId_userId: { guildId: interaction.guildId!, userId: to.id } },
      update: { favor: { increment: amt } },
      create: { guildId: interaction.guildId!, userId: to.id, favor: amt }
    });
    await interaction.reply(`Granted **${amt}** favor to ${userMention(to.id)}.`);
  }
}
