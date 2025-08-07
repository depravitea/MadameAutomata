import { Client, GatewayIntentBits, Partials, Events, Collection, REST, Routes } from 'discord.js';
import { CONFIG } from './config.js';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// ----- Robust command loader (works in dev src/ and prod dist/) -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.join(__dirname, 'commands');

export const commands = new Collection<string, any>();
for (const file of fs.existsSync(commandsDir) ? fs.readdirSync(commandsDir) : []) {
  if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
  const mod = await import(`./commands/${file}`);
  if (mod.data && mod.execute) {
    commands.set(mod.data.name, mod);
  }
}
// --------------------------------------------------------------------

client.once(Events.ClientReady, async (c) => {
  log.info({ user: c.user.tag }, 'Ready. Registering slash commands...');
  const rest = new REST({ version: '10' }).setToken(CONFIG.token);
  const body = commands.map((cmd) => cmd.data.toJSON());
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
    const msg = { content: 'Something went wrong. My apologies, pet.', ephemeral: true as const };
    if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

client.login(CONFIG.token);

