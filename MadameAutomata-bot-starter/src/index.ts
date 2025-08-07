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
console.log('A) Booting…', {
  hasToken: !!process.env.DISCORD_TOKEN,
  tokenMask: mask(process.env.DISCORD_TOKEN),
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.GUILD_ID
});

const port = Number(process.env.PORT || 8080);
http.createServer((_req, res)=>{ res.writeHead(200); res.end('OK'); })
  .listen(port, () => console.log('B) Healthcheck HTTP on :', port));

console.log('C) Creating Discord client…');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message]
});

console.log('D) Loading commands…');
import { Collection } from 'discord.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.join(__dirname, 'commands');
export const commands = new Collection<string, any>();

try {
  const exists = fs.existsSync(commandsDir);
  console.log('   - commandsDir:', commandsDir, 'exists?', exists);
  const files = exists ? fs.readdirSync(commandsDir).filter(f => f.endsWith('.js') || f.endsWith('.ts')) : [];
  console.log('   - command files:', files);
  for (const file of files) {
    const mod = await import(`./commands/${file}`);
    if (mod.data && mod.execute) commands.set(mod.data.name, mod);
  }
  console.log('E) Loaded commands:', [...commands.keys()]);
} catch (e) {
  console.error('E) COMMAND LOAD FAILED:', e);
}

client.once(Events.ClientReady, async (c) => {
  console.log('F) Client ready as', c.user.tag, '— registering slash commands…');
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
  const body = commands.map((cmd) => cmd.data.toJSON());
  try {
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.GUILD_ID), { body });
      console.log('   - Registered guild commands.');
    } else {
      await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), { body });
      console.log('   - Registered global commands.');
    }
  } catch (e) {
    console.error('   - COMMAND REGISTRATION FAILED:', e);
  }
  console.log('✅ MadameAutomata is online.');
});

console.log('G) Logging in…');
try {
  await client.login(process.env.DISCORD_TOKEN!);
  console.log('   - LOGIN OK');
} catch (e) {
  console.error('   - LOGIN FAILED:', e);
}


