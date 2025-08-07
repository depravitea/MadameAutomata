import { REST, Routes } from 'discord.js';
import { CONFIG } from './config.js';
import fs from 'node:fs';
import path from 'node:path';

const rest = new REST({ version: '10' }).setToken(CONFIG.token);
const commandsPath = path.join(process.cwd(), 'src', 'commands');
const commands = [];
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
  const mod = await import(`./commands/${file}`);
  if (mod.data) commands.push(mod.data.toJSON());
}
const route = CONFIG.guildId
  ? Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId)
  : Routes.applicationCommands(CONFIG.clientId);

await rest.put(route, { body: commands });
console.log('Commands registered.');
