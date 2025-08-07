import 'dotenv/config';
import http from 'node:http';
import { Client, GatewayIntentBits, Partials, Events, REST, Routes, Collection } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ----- ESM __dirname fix -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- Export prisma for commands -----
export const prisma = new PrismaClient();

// ----- Keep Railway happy (healthcheck HTTP) -----
const port = Number(process.env.PORT || 8080);
http.createServer((_req, res) => { res.writeHead(200); res.end('OK'); })
  .listen(port, () => console.log('Healthcheck HTTP on :', port));

// ----- Discord client -----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message]
});

// ----- Dynamic command loader (dist/commands/*.js) -----
export const commands = new Collection<string, any>();
const commandsDir = path.join(__dirname, 'commands');
if (fs.existsSync(commandsDir)) {
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const mod = await import(`file://${path.join(commandsDir, file)}`);
    if (mod.data && mod.execute) commands.set(mod.data.name, mod);
  }
}
console.log('Loaded commands:', [...commands.keys()]);

// ----- Ready → register slash commands -----
client.once(Events.ClientReady, async (c) => {
  console.log('Ready as', c.user.tag, '— registering slash commands…');
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
  const body = [...commands.values()].map(cmd => cmd.data.toJSON());
  try {
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.GUILD_ID),
        { body }
      );
      console.log('Registered guild commands.');
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
        { body }
      );
      console.log('Registered global commands.');
    }
  } catch (e) {
    console.error('COMMAND REGISTRATION FAILED:', e);
  }
  console.log('✅ MadameAutomata is online.');
});

// ----- Interaction handler -----
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) return;
  try { await command.execute(interaction); }
  catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({ content: 'Something went wrong.', ephemeral: true });
    else
      await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
  }
});

// ----- Login with loud diagnostics -----
process.on('unhandledRejection', (e)=>console.error('UNHANDLED REJECTION:', e));
process.on('uncaughtException', (e)=>console.error('UNCAUGHT EXCEPTION:', e));
console.log('Logging in…', {
  hasToken: !!process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.GUILD_ID
});
client.login(process.env.DISCORD_TOKEN!)
  .then(() => console.log('LOGIN OK'))
  .catch((e) => console.error('LOGIN FAILED:', e));
