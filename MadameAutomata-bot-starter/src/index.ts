import http from 'node:http';
import { Client, GatewayIntentBits, Partials, Events, Collection, REST, Routes } from 'discord.js';
import { CONFIG } from './config.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- DIAGNOSTICS ----------
process.on('unhandledRejection', (e)=>console.error('UNHANDLED REJECTION:', e));
process.on('uncaughtException', (e)=>console.error('UNCAUGHT EXCEPTION:', e));
const mask = (s?: string)=> s ? s.slice(0,4)+'…('+s.length+')' : 'MISSING';
console.log('Booting…', {
  hasToken: !!process.env.DISCORD_TOKEN,
  tokenMask: mask(process.env.DISCORD_TOKEN),
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.GUILD_ID
});

// Tiny HTTP server so Railway won’t kill the bot
const port = Number(process.env.PORT || 8080);
http.createServer((_req, res)=>{ res.writeHead(200); res.end('OK'); })
  .listen(port, ()=> console.log('Healthcheck HTTP on :', port));

// ---------- DISCORD CLIENT ----------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message]
});

// ---------- COMMAND LOADER (src in dev, dist in prod) ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.join(__dirname, 'commands');
export const commands = new Collection<string, any>();

try {
  const files = fs.existsSync(commandsDir)
    ? fs.readdirSync(commandsDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'))
    : [];
  for (const file of files) {
    const mod = await import(`./commands/${file}`);
    if (mod.data && mod.execute) commands.set(mod.data.name, mod);
  }
  console.log('Loaded commands:', [...commands.keys()]);
} catch (e) {
  console.error('COMMAND LOAD FAILED:', e);
}

// ---------- READY → REGISTER SLASH COMMANDS ----------
client.once(Events.ClientReady, async (c) => {
  console.log('Ready as', c.user.tag, '— registering slash commands…');
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
  const body = [...commands.values()].map(cmd => cmd.data.toJSON());
  try {
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.GUILD_ID), { body });
      console.log('Registered guild commands.');
    } else {
      await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), { body });
      console.log('Registered global commands.');
    }
  } catch (e) {
    console.error('COMMAND REGISTRATION FAILED:', e);
  }
  console.log('✅ MadameAutomata is online.');
});

// ---------- INTERACTIONS ----------
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

// ---------- LOGIN (guarded) ----------
console.log('Logging in…');
try {
  await client.login(process.env.DISCORD_TOKEN!);
  console.log('LOGIN OK');
} catch (e) {
  console.error('LOGIN FAILED:', e);
}


