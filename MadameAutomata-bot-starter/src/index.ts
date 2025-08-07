import { Client, GatewayIntentBits, Partials, Events, Collection, REST, Routes } from 'discord.js';
import { CONFIG } from './config.js';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---- DIAGNOSTICS ----
process.on('unhandledRejection', (e)=>console.error('UNHANDLED REJECTION:', e));
process.on('uncaughtException', (e)=>console.error('UNCAUGHT EXCEPTION:', e));
const mask = (s?: string)=> s ? s.slice(0,4)+'…('+s.length+')' : 'MISSING';
console.log('Booting MadameAutomata… env:', {
  hasToken: !!process.env.DISCORD_TOKEN,
  tokenMask: mask(process.env.DISCORD_TOKEN),
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.GUILD_ID,
});
// ---------------------

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

// command loader (src in dev, dist in prod)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.join(__dirname, 'commands');

export const commands = new Collection<string, any>();
for (const file of (fs.existsSync(commandsDir) ? fs.readdirSync(commandsDir) : [])) {
  if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
  const mod = await import(`./commands/${file}`);
  if (mod.data && mod.execute) commands.set(mod.data.name, mod);
}

client.once(Events.ClientReady, async (c) => {
  log.info({ user: c.user.tag }, 'Ready. Registering slash commands...');
  const rest = new REST({ version: '10' }).setToken(CONFIG.token);
  const body = commands.map((cmd) => cmd.data.toJSON());
  try {
    if (CONFIG.guildId) {
      await rest.put(Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId), { body });
      log.info('Registered guild commands.');
    } else {
      await rest.put(Routes.applicationCommands(CONFIG.clientId), { body });
      log.info('Registered global commands.');
    }
  } catch (e) {
    console.error('COMMAND REGISTRATION FAILED:', e);
  }
  log.info('MadameAutomata is online.');
});

client.on(Events.Error, (e)=> console.error('DISCORD CLIENT ERROR:', e));
client.on(Events.ShardError, (e)=> console.error('SHARD ERROR:', e));

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) return;
  try { await command.execute(interaction); }
  catch (err) {
    log.error(err);
    const msg = { content: 'Something went wrong. My apologies, pet.', ephemeral: true as const };
    if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

try {
  await client.login(CONFIG.token);
  console.log('LOGIN OK');
} catch (e) {
  console.error('LOGIN FAILED:', e);
  process.exit(1);
}
