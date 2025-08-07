# MadameAutomata — Femdom Gothic Discord Bot (Starter)

This is a production-grade starter for your femdom-focused, gothic dark-romance bot. It includes:
- TypeScript + discord.js v14
- Prisma + PostgreSQL
- Redis + BullMQ (ready for scheduled jobs)
- Modular slash commands
- Railway one-click deploy
- Gothic embed theming + starter commands (`/house-setup`, `/own`, `/release`, `/safeword`, `/assign`, `/jail`, `/favor`, `/welcome`)

## 1) Create your Discord application
- Go to https://discord.com/developers/applications
- New Application → **Name:** MadameAutomata
- Bot → Add Bot → **Privileged Intents:** enable *Server Members* and *Message Content*.
- Copy **Token** and **Client ID**.

## 2) Prepare environment
Duplicate `.env.example` to `.env` and fill:
```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
GUILD_ID=  # set during testing for fast registration
DATABASE_URL=postgresql://...  # Railway Postgres or Neon
REDIS_URL=redis://...          # Railway Redis
```

## 3) Railway Deploy (easiest + best performance/scale)
- Create a GitHub repo with this folder.
- In Railway: New Project → *Deploy from GitHub* (select the repo).
- Add two services: **PostgreSQL** and **Redis** (provisioned from Railway plugins).
- In project Variables, set `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_URL`, `REDIS_URL`, and (optionally) `GUILD_ID`.
- In the Railway service, set Start Command to: `npm run start` (Railway will `npm install && npm run build` first).
- Run once: `npm run prisma:push` using Railway's shell to create tables.

## 4) Local Dev
```
npm i
npm run prisma:gen
cp .env.example .env  # fill values
npm run dev
```
Invite URL scopes: `bot applications.commands` with permissions `268823638` (Manage Roles/Channels optional if you use jail/role actions).

## 5) Setting the bot avatar
Upload `assets/avatar.jpg` as the bot avatar in the Discord Developer Portal (Bot → Profile → Avatar).

---

### Notes
- This is a starter; full feature parity with IVAR requires additional commands that can slot into `src/commands/` and Prisma models already defined.
- Use `/house-setup` to save channels.
- Run `npm run register` to register or update slash commands quickly.
