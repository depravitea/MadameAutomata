import { Client, GatewayIntentBits, Partials, Events, Collection, REST, Routes } from 'discord.js';
import { CONFIG } from './config.js';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

export const log = pino({ name: 'madameautomata' });
export const prisma = new PrismaClient();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message]
});

// Dynamic command loader
export const commands = new Collection<string, any>();
const commandsPath = path.join(process.cwd(), 'src', 'commands');
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
  const mod = await import(`./commands/${file}`);
  if (mod.data && mod.execute) {
    commands.set(mod.data.name, mod);
  }
}

client.once(Events.ClientReady, async (c) => {
  log.info({ user: c.user.tag }, 'Ready. Registering slash commands...');
  const rest = new REST({ version: '10' }).setToken(CONFIG.token);
  const body = commands.map(cmd => cmd.data.toJSON());
  if (CONFIG.guildId) {
    await rest.put(Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId), { body });
    log.info('Registered guild commands.');
  } else {
    await rest.put(Routes.applicationCommands(CONFIG.clientId), { body });
    log.info('Registered global commands.');
  }
  log.info('MadameAutomata is online.');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    log.error(err);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: 'Something went wrong. My apologies, pet.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Something went wrong. My apologies, pet.', ephemeral: true });
    }
  }
});

client.login(CONFIG.token);
