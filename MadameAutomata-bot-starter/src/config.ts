import 'dotenv/config';

export const CONFIG = {
  token: process.env.DISCORD_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  guildId: process.env.GUILD_ID, // optional for dev-only registration
  theme: {
    primary: 0x7a1128, // crimson-ish (override in /house theme later)
    accent: 0x0f0f14,  // onyx
    soft: 0xf2efe9     // ivory
  }
};
